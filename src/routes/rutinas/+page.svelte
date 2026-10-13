<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '#lib/db.ts';

	const rutinas = liveQuery(() => db.rutinas.toArray());
	const ejercicios = liveQuery(async () => new Map((await db.ejercicios.toArray()).map((e) => [e.id, e])));

	const lugar = { casa: 'Casa', gym: 'Gimnasio', ambos: 'Casa o gym' } as const;
</script>

<div class="spread">
	<h1>Rutinas</h1>
	<a class="btn primary" href="/rutinas/editar">+ Nueva</a>
</div>

{#each $rutinas ?? [] as r (r.id)}
	<div class="card">
		<div class="spread">
			<h3>{r.nombre}</h3>
			<span class="chip">{lugar[r.lugar]}</span>
		</div>
		{#if r.descripcion}<p class="muted">{r.descripcion}</p>{/if}
		<ul>
			{#each r.items as it, i (i)}
				{@const e = $ejercicios?.get(it.ejercicioId)}
				<li>
					{e?.nombre ?? ($ejercicios ? 'Ejercicio eliminado' : '…')}
					<span class="muted">
						{it.series} × {it.segundos != null ? `${it.segundos}s` : `${it.reps} reps`}
					</span>
				</li>
			{/each}
		</ul>
		<div class="row">
			<a class="btn primary" href="/entrenar?rutina={r.id}">Empezar</a>
			<a class="btn" href="/rutinas/editar?id={r.id}">Editar</a>
		</div>
	</div>
{:else}
	{#if $rutinas}
		<p class="empty">No tienes rutinas todavía.</p>
	{/if}
{/each}

<style>
	ul {
		margin: 8px 0 12px;
		padding-left: 18px;
	}
	li {
		margin: 4px 0;
	}
</style>
