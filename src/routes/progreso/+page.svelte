<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { liveQuery } from 'dexie';
	import { db, type RegistroCorporal } from '#lib/db.ts';
	import Grafica from '#lib/components/Grafica.svelte';
	import { fechaCorta, hoyISO, inicioSemana, unoRM } from '#lib/util.ts';

	const corporal = liveQuery(() => db.corporal.orderBy('fecha').toArray());
	const sesiones = liveQuery(() => db.sesiones.orderBy('inicio').toArray());

	// ---- Registro corporal ----
	const MEDIDAS = [
		{ k: 'peso', label: 'Peso', unidad: 'kg' },
		{ k: 'cintura', label: 'Cintura', unidad: 'cm' },
		{ k: 'pecho', label: 'Pecho', unidad: 'cm' },
		{ k: 'brazo', label: 'Brazo', unidad: 'cm' },
		{ k: 'cadera', label: 'Cadera', unidad: 'cm' },
		{ k: 'muslo', label: 'Muslo', unidad: 'cm' }
	] as const;
	type Medida = (typeof MEDIDAS)[number]['k'];

	let form = $state<Partial<Record<Medida, number | null>> & { fecha: string; notas: string }>({
		fecha: hoyISO(),
		notas: ''
	});
	let medida = $state<Medida>('peso');

	async function guardarCorporal() {
		const reg: Omit<RegistroCorporal, 'id'> = { fecha: form.fecha };
		let alguno = false;
		for (const m of MEDIDAS) {
			const v = form[m.k];
			if (typeof v === 'number' && v > 0) {
				reg[m.k] = v;
				alguno = true;
			}
		}
		if (!alguno) return alert('Escribe al menos una medida.');
		if (form.notas.trim()) reg.notas = form.notas.trim();
		await db.corporal.add(reg as RegistroCorporal);
		form = { fecha: hoyISO(), notas: '' };
	}

	const serieCorporal = $derived(($corporal ?? []).filter((r) => r[medida] != null));
	const infoMedida = $derived(MEDIDAS.find((m) => m.k === medida)!);
	const cambio = $derived.by(() => {
		const s = serieCorporal;
		if (s.length < 2) return null;
		return (s.at(-1)![medida] as number) - (s[0][medida] as number);
	});

	// ---- Progreso por ejercicio ----
	const ejerciciosHechos = $derived.by(() => {
		const m = new Map<number, { nombre: string; tipo: string }>();
		for (const s of $sesiones ?? []) for (const e of s.ejercicios) m.set(e.ejercicioId, e);
		return [...m.entries()].map(([id, e]) => ({ id, ...e })).sort((a, b) => a.nombre.localeCompare(b.nombre));
	});
	let ejercicioSel = $state<number | ''>('');
	const ejActual = $derived(
		ejerciciosHechos.find((e) => e.id === ejercicioSel) ?? ejerciciosHechos[0]
	);

	type Metrica = '1rm' | 'peso' | 'reps' | 'tiempo';
	let metrica = $state<Metrica>('1rm');
	const conPeso = $derived.by(() => {
		if (!ejActual) return false;
		return ($sesiones ?? []).some((s) =>
			s.ejercicios.some((e) => e.ejercicioId === ejActual.id && e.series.some((x) => (x.peso ?? 0) > 0))
		);
	});
	const metricaEf = $derived<Metrica>(
		ejActual?.tipo === 'tiempo' ? 'tiempo' : !conPeso ? 'reps' : metrica === 'tiempo' ? '1rm' : metrica
	);

	const puntosEjercicio = $derived.by(() => {
		if (!ejActual) return [];
		const pts: { fecha: string; v: number }[] = [];
		for (const s of $sesiones ?? []) {
			const e = s.ejercicios.find((x) => x.ejercicioId === ejActual.id);
			if (!e) continue;
			const vals = e.series.filter((x) => x.hecha).map((x) => {
				if (metricaEf === 'tiempo') return x.segundos ?? 0;
				if (metricaEf === 'reps') return x.reps ?? 0;
				if (metricaEf === 'peso') return x.peso ?? 0;
				return unoRM(x.peso ?? 0, x.reps ?? 0);
			});
			if (vals.length) pts.push({ fecha: s.inicio, v: Math.max(...vals) });
		}
		return pts;
	});
	const etiquetaMetrica: Record<Metrica, { t: string; u: string }> = {
		'1rm': { t: '1RM estimado (máximo que podrías levantar 1 vez)', u: 'kg' },
		peso: { t: 'Peso máximo usado', u: 'kg' },
		reps: { t: 'Mejor serie (repeticiones)', u: 'reps' },
		tiempo: { t: 'Mejor tiempo', u: 's' }
	};

	// ---- Constancia: entrenos por semana (últimas 12) ----
	const semanas = $derived.by(() => {
		const base = inicioSemana(new Date());
		const out = Array.from({ length: 12 }, (_, i) => {
			const d = new Date(base);
			d.setDate(d.getDate() - 7 * (11 - i));
			return { t: d.getTime(), etiqueta: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), n: 0 };
		});
		for (const s of $sesiones ?? []) {
			const t = inicioSemana(new Date(s.inicio)).getTime();
			const w = out.find((x) => x.t === t);
			if (w) w.n++;
		}
		return out;
	});
</script>

<h1>Progreso</h1>

<h2>Cuerpo</h2>
<div class="card stack">
	<div class="grid">
		<label>Fecha <input type="date" bind:value={form.fecha} /></label>
		{#each MEDIDAS as m (m.k)}
			<label>{m.label} ({m.unidad})
				<input type="number" inputmode="decimal" step="0.1" min="0" bind:value={form[m.k]} placeholder="—" />
			</label>
		{/each}
	</div>
	<label>Notas <input bind:value={form.notas} placeholder="Opcional" /></label>
	<button class="primary" onclick={guardarCorporal}>Guardar medición</button>
</div>

<div class="card">
	<div class="spread">
		<select bind:value={medida} style="width:auto">
			{#each MEDIDAS as m (m.k)}<option value={m.k}>{m.label}</option>{/each}
		</select>
		{#if cambio != null}
			<span class="muted">
				Cambio total: <b class="delta">{cambio > 0 ? '+' : ''}{cambio.toFixed(1)} {infoMedida.unidad}</b>
			</span>
		{/if}
	</div>
	{#if serieCorporal.length >= 2}
		<Grafica
			etiquetas={serieCorporal.map((r) => fechaCorta(r.fecha))}
			valores={serieCorporal.map((r) => r[medida] as number)}
			unidad={infoMedida.unidad}
			descripcion="{infoMedida.label} a lo largo del tiempo"
		/>
	{:else}
		<p class="empty">Registra al menos 2 mediciones de {infoMedida.label.toLowerCase()} para ver la gráfica.</p>
	{/if}
	{#if serieCorporal.length}
		<details>
			<summary class="muted">Ver registros ({serieCorporal.length})</summary>
			<table>
				<tbody>
					{#each [...serieCorporal].reverse() as r (r.id)}
						<tr>
							<td>{fechaCorta(r.fecha)}</td>
							<td>{r[medida]} {infoMedida.unidad}</td>
							<td><button class="small ghost danger" onclick={() => confirm('¿Borrar este registro?') && db.corporal.delete(r.id)} aria-label="Borrar registro"><X size={16} /></button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</details>
	{/if}
</div>

<h2>Fuerza y resistencia</h2>
{#if ejerciciosHechos.length}
	<div class="card stack">
		<div class="row">
			<select
				value={ejActual?.id}
				onchange={(e) => (ejercicioSel = Number(e.currentTarget.value))}
				style="flex:1;min-width:0"
			>
				{#each ejerciciosHechos as e (e.id)}<option value={e.id}>{e.nombre}</option>{/each}
			</select>
			{#if ejActual?.tipo !== 'tiempo' && conPeso}
				<select bind:value={metrica} style="width:auto">
					<option value="1rm">1RM est.</option>
					<option value="peso">Peso máx.</option>
					<option value="reps">Reps</option>
				</select>
			{/if}
		</div>
		<p class="muted">{etiquetaMetrica[metricaEf].t}</p>
		{#if puntosEjercicio.length >= 2}
			<Grafica
				etiquetas={puntosEjercicio.map((p) => fechaCorta(p.fecha))}
				valores={puntosEjercicio.map((p) => p.v)}
				unidad={etiquetaMetrica[metricaEf].u}
				descripcion="{etiquetaMetrica[metricaEf].t} de {ejActual?.nombre}"
			/>
		{:else}
			<p class="empty">Haz este ejercicio al menos 2 veces para ver tu evolución.</p>
		{/if}
	</div>
{:else}
	<p class="empty">Cuando completes entrenos verás aquí cómo mejoras en cada ejercicio.</p>
{/if}

<h2>Constancia</h2>
<div class="card">
	<p class="muted">Entrenos por semana (últimas 12)</p>
	<Grafica
		tipo="bar"
		etiquetas={semanas.map((s) => s.etiqueta)}
		valores={semanas.map((s) => s.n)}
		unidad="entrenos"
		descripcion="Número de entrenos por semana en las últimas 12 semanas"
	/>
</div>

<style>
	.delta {
		font-family: var(--font-display);
		font-size: 1.4rem;
		color: var(--accent);
	}
	details {
		margin-top: 10px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 6px;
	}
	td {
		padding: 4px 0;
		border-bottom: 1px solid var(--border);
	}
	td:last-child {
		text-align: right;
	}
</style>
