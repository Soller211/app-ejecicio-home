<script lang="ts">
	import { catalogo, urlImagen } from '#lib/catalogo.svelte.ts';

	interface Props {
		imagenes?: string[];
		nombre: string;
		/** mini: miniatura cuadrada; grande: alterna las fotos para mostrar el movimiento */
		tamano?: 'mini' | 'grande';
	}

	let { imagenes = [], nombre, tamano = 'grande' }: Props = $props();

	let cuadro = $state(0);
	let fallo = $state(false);
	const hay = $derived(
		imagenes.length > 0 && (imagenes[0].startsWith('/') || !!catalogo.imagenesBase) && !fallo
	);

	$effect(() => {
		if (tamano !== 'grande' || imagenes.length < 2) return;
		const t = setInterval(() => (cuadro = (cuadro + 1) % imagenes.length), 1000);
		return () => clearInterval(t);
	});
</script>

{#if tamano === 'mini'}
	<div class="mini" class:ilustracion={imagenes[0]?.startsWith('/')} aria-hidden="true">
		{#if hay}
			<img src={urlImagen(imagenes[0])} alt="" loading="lazy" crossorigin="anonymous" onerror={() => (fallo = true)} />
		{:else}
			<span>💪</span>
		{/if}
	</div>
{:else if hay}
	<div class="grande">
		{#each imagenes as img, i (img)}
			<img
				src={urlImagen(img)}
				alt="{nombre}: posición {i + 1} de {imagenes.length}"
				loading="lazy"
				crossorigin="anonymous"
				class:visible={i === cuadro}
				onerror={() => (fallo = true)}
			/>
		{/each}
		{#if imagenes.length > 1}
			<span class="paso">
				{imagenes.length === 2 ? (cuadro === 0 ? 'Inicio' : 'Final') : `Paso ${cuadro + 1} de ${imagenes.length}`}
			</span>
		{/if}
	</div>
{/if}

<style>
	.mini {
		width: 52px;
		height: 52px;
		flex: none;
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface-2);
		display: grid;
		place-items: center;
		font-size: 1.3rem;
	}
	.mini img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.mini.ilustracion {
		background: #fff;
	}
	.mini.ilustracion img {
		object-fit: contain;
		transform: scale(1.5);
	}
	.grande {
		position: relative;
		aspect-ratio: 4 / 3;
		max-height: 260px;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		background: #fff;
	}
	.grande img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		opacity: 0;
		transition: opacity 0.25s;
	}
	.grande img.visible {
		opacity: 1;
	}
	.paso {
		position: absolute;
		left: 8px;
		bottom: 8px;
		font-size: 0.75rem;
		background: rgb(0 0 0 / 0.6);
		color: #fff;
		padding: 2px 8px;
		border-radius: 999px;
	}
	@media (prefers-reduced-motion: reduce) {
		.grande img {
			transition: none;
		}
	}
</style>
