<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '#lib/db.ts';
	import { fechaCorta, minutosSesion, seriesHechas, volumenSesion } from '#lib/util.ts';

	const sesiones = liveQuery(() => db.sesiones.orderBy('inicio').reverse().toArray());
	let abierta = $state<number | null>(null);
</script>

<h1>Historial</h1>

{#each $sesiones ?? [] as s (s.id)}
	{@const vol = volumenSesion(s)}
	<div class="card">
		<button class="ghost head" onclick={() => (abierta = abierta === s.id ? null : s.id)}>
			<span>
				<b>{s.rutinaNombre}</b><br />
				<span class="muted">
					{minutosSesion(s)} min · {seriesHechas(s)} series{vol ? ` · ${Math.round(vol)} kg movidos` : ''}{s.esfuerzo ? ` · esfuerzo ${s.esfuerzo}/10` : ''}
				</span>
			</span>
			<span class="muted">{fechaCorta(s.inicio)}</span>
		</button>
		{#if abierta === s.id}
			<div class="detalle">
				{#each s.ejercicios as e, i (i)}
					<div class="ej">
						<b>{e.nombre}</b>
						<span class="muted">
							{e.series
								.map((x) =>
									e.tipo === 'tiempo' ? `${x.segundos}s` : `${x.reps}${x.peso ? `×${x.peso}kg` : ''}`
								)
								.join(' · ')}
						</span>
					</div>
				{/each}
				{#if s.notas}<p class="notas">📝 {s.notas}</p>{/if}
				<button
					class="small ghost danger"
					onclick={() => confirm('¿Borrar este entreno del historial?') && db.sesiones.delete(s.id)}
				>
					Borrar entreno
				</button>
			</div>
		{/if}
	</div>
{:else}
	{#if $sesiones}
		<p class="empty">Aún no hay entrenos guardados. <a href="/">¡Empieza uno!</a></p>
	{/if}
{/each}

<style>
	.head {
		width: 100%;
		justify-content: space-between;
		align-items: flex-start;
		text-align: left;
		padding: 0;
		min-height: 0;
	}
	.detalle {
		margin-top: 10px;
		border-top: 1px solid var(--border);
		padding-top: 10px;
	}
	.ej {
		display: flex;
		flex-direction: column;
		margin-bottom: 8px;
	}
	.notas {
		font-size: 0.9rem;
	}
</style>
