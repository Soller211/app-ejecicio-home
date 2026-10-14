<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { asegurarCatalogo } from '#lib/catalogo.svelte.ts';
	import { guardarFotosDeRutinas } from '#lib/fotos.svelte.ts';
	import type { LayoutProps } from './$types';
	import House from '@lucide/svelte/icons/house';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';

	let { children }: LayoutProps = $props();

	onMount(async () => {
		await asegurarCatalogo();
		// Así las fotos de tus rutinas funcionan en el gym aunque no haya señal.
		guardarFotosDeRutinas();
	});

	const tabs = [
		{ href: '/', label: 'Inicio', icon: House },
		{ href: '/rutinas', label: 'Rutinas', icon: ListChecks },
		{ href: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
		{ href: '/progreso', label: 'Progreso', icon: TrendingUp },
		{ href: '/historial', label: 'Historial', icon: CalendarDays }
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
	<nav aria-label="Secciones">
		{#each tabs as t (t.href)}
			<a href={t.href} class:on={activo(t.href)} aria-current={activo(t.href) ? 'page' : undefined}>
				<span class="ico"><t.icon size={22} strokeWidth={activo(t.href) ? 2.5 : 2} /></span>
				{t.label}
			</a>
		{/each}
	</nav>
{/if}

<style>
	nav {
		position: fixed;
		left: 12px;
		right: 12px;
		bottom: calc(10px + env(safe-area-inset-bottom));
		max-width: 520px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		background: rgb(19 21 27 / 0.92);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid var(--border);
		border-radius: 22px;
		padding: 6px;
		z-index: 10;
		box-shadow: var(--shadow);
	}
	nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 6px 0 4px;
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--muted);
		text-decoration: none;
		border-radius: 16px;
	}
	.ico {
		display: grid;
		place-items: center;
		width: 46px;
		height: 30px;
		border-radius: 999px;
		transition: background 0.2s;
	}
	nav a.on {
		color: var(--text);
	}
	nav a.on .ico {
		background: var(--accent);
		color: var(--accent-ink);
	}
</style>
