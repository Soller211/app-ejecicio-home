<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '#lib/db.ts';
	import { fechaCorta, inicioSemana, minutosSesion, rachaSemanas, seriesHechas } from '#lib/util.ts';
	import { sesionEnCurso } from '#lib/sesion.ts';

	const sesiones = liveQuery(() => db.sesiones.orderBy('inicio').reverse().toArray());
	const rutinas = liveQuery(() => db.rutinas.toArray());
	const ultimoPeso = liveQuery(() =>
		db.corporal
			.orderBy('fecha')
			.reverse()
			.filter((r) => r.peso != null)
			.first()
	);

	const enCurso = sesionEnCurso();

	const estaSemana = $derived(
		($sesiones ?? []).filter(
			(s) => new Date(s.inicio).getTime() >= inicioSemana(new Date()).getTime()
		).length
	);
	const racha = $derived(rachaSemanas($sesiones ?? []));
	const ultima = $derived($sesiones?.[0]);

	const saludo = (() => {
		const h = new Date().getHours();
		return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
	})();
</script>

<div class="spread">
	<h1>{saludo} 👋</h1>
	<a class="btn ghost" href="/ajustes" aria-label="Ajustes">⚙️</a>
</div>

{#if enCurso}
	<a class="card resume" href="/entrenar">
		<b>Tienes un entreno en curso</b>
		<span class="muted">{enCurso.rutinaNombre} · toca para continuar</span>
	</a>
{/if}

<div class="grid">
	<div class="stat"><b>{estaSemana}</b><span>entrenos esta semana</span></div>
	<div class="stat"><b>{racha}</b><span>semanas seguidas</span></div>
	<div class="stat"><b>{$sesiones?.length ?? 0}</b><span>entrenos en total</span></div>
	<div class="stat">
		<b>{$ultimoPeso?.peso != null ? `${$ultimoPeso.peso} kg` : '—'}</b>
		<span>peso actual</span>
	</div>
</div>

<h2>Entrenar hoy</h2>
{#if $rutinas && $rutinas.length}
	{#each $rutinas as r (r.id)}
		<div class="card spread">
			<div>
				<h3>{r.nombre}</h3>
				<span class="muted">{r.items.length} ejercicios · {r.lugar === 'gym' ? 'Gimnasio' : r.lugar === 'casa' ? 'Casa' : 'Casa o gym'}</span>
			</div>
			<a class="btn primary" href="/entrenar?rutina={r.id}">Empezar</a>
		</div>
	{/each}
{:else if $rutinas}
	<div class="empty">
		Aún no tienes rutinas. <a href="/rutinas/editar">Crea la primera</a>.
	</div>
{/if}
<a class="btn block" href="/entrenar?libre=1">Entreno libre (sin rutina)</a>

{#if ultima}
	<h2>Último entreno</h2>
	<a class="card last" href="/historial">
		<div class="spread">
			<b>{ultima.rutinaNombre}</b>
			<span class="muted">{fechaCorta(ultima.inicio)}</span>
		</div>
		<span class="muted">{minutosSesion(ultima)} min · {seriesHechas(ultima)} series</span>
	</a>
{/if}

<div class="card tip">
	<b>Consejo:</b> registra tu peso y medidas cada 1–2 semanas en
	<a href="/progreso">Progreso</a>. Los cambios se notan mejor en semanas, no en días.
</div>

<style>
	.resume,
	.last {
		display: block;
		color: inherit;
		text-decoration: none;
	}
	.resume {
		border-color: var(--accent);
	}
	.resume b {
		display: block;
		color: var(--accent);
	}
	.tip {
		margin-top: 24px;
		font-size: 0.9rem;
	}
</style>
