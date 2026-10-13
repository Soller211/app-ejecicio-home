<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { asegurarCatalogo } from '#lib/catalogo.svelte.ts';
	import { guardarFotosDeRutinas } from '#lib/fotos.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(async () => {
		await asegurarCatalogo();
		// Así las fotos de tus rutinas funcionan en el gym aunque no haya señal.
		guardarFotosDeRutinas();
	});

	const tabs = [
		{ href: '/', label: 'Inicio', icon: '🏠' },
		{ href: '/rutinas', label: 'Rutinas', icon: '📋' },
		{ href: '/ejercicios', label: 'Ejercicios', icon: '💪' },
		{ href: '/progreso', label: 'Progreso', icon: '📈' },
		{ href: '/historial', label: 'Historial', icon: '🗓️' }
	];

	const activo = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	// En la pantalla de entrenamiento ocultamos la barra para no salir por accidente.
	const enEntreno = $derived(page.url.pathname.startsWith('/entrenar'));
</script>

<main>
	{@render children()}
</main>

{#if !enEntreno}
	<nav>
		{#each tabs as t (t.href)}
			<a href={t.href} class:on={activo(t.href)}>
				<span aria-hidden="true">{t.icon}</span>
				{t.label}
			</a>
		{/each}
	</nav>
{/if}

<style>
	nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		background: var(--surface);
		border-top: 1px solid var(--border);
		padding-bottom: env(safe-area-inset-bottom);
		z-index: 10;
	}
	nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 0 10px;
		font-size: 0.72rem;
		color: var(--muted);
		text-decoration: none;
	}
	nav a span {
		font-size: 1.25rem;
	}
	nav a.on {
		color: var(--accent);
	}
</style>
