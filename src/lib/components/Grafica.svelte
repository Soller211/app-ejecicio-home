<script lang="ts">
	import {
		BarController,
		BarElement,
		CategoryScale,
		Chart,
		Filler,
		LinearScale,
		LineController,
		LineElement,
		PointElement,
		Tooltip
	} from 'chart.js';

	Chart.register(
		LineController,
		LineElement,
		PointElement,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Filler
	);

	interface Props {
		tipo?: 'line' | 'bar';
		etiquetas: string[];
		valores: number[];
		unidad?: string;
		/** Texto accesible que resume la gráfica */
		descripcion: string;
	}

	let { tipo = 'line', etiquetas, valores, unidad = '', descripcion }: Props = $props();

	let canvas: HTMLCanvasElement;

	const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

	$effect(() => {
		const acento = css('--accent');
		const tenue = css('--muted');
		const borde = css('--border');
		const superficie = css('--surface');
		Chart.defaults.font.family = css('--font-body');
		const fmt = (v: number) => `${Number(v.toFixed(1))}${unidad ? ' ' + unidad : ''}`;

		const chart = new Chart(canvas, {
			type: tipo,
			data: {
				labels: [...etiquetas],
				datasets: [
					{
						data: [...valores],
						borderColor: acento,
						backgroundColor:
							tipo === 'bar'
								? acento
								: (c: { chart: Chart }) => {
										// Degradado bajo la línea: del acento a transparente
										const { ctx, chartArea } = c.chart;
										if (!chartArea) return acento + '22';
										const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
										g.addColorStop(0, acento + '55');
										g.addColorStop(1, acento + '00');
										return g;
									},
						borderWidth: tipo === 'bar' ? 0 : 3,
						borderRadius: 6,
						fill: tipo === 'line',
						tension: 0.25,
						pointRadius: valores.length > 30 ? 0 : 4,
						pointHoverRadius: 6,
						pointBackgroundColor: acento,
						pointBorderColor: superficie,
						pointBorderWidth: 2,
						maxBarThickness: 28
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (c) => fmt(c.parsed.y ?? 0) } }
				},
				scales: {
					x: {
						grid: { display: false },
						border: { color: borde },
						ticks: { color: tenue, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
					},
					y: {
						beginAtZero: tipo === 'bar',
						grid: { color: borde },
						border: { display: false },
						ticks: { color: tenue, maxTicksLimit: 5, precision: tipo === 'bar' ? 0 : undefined }
					}
				}
			}
		});
		return () => chart.destroy();
	});
</script>

<div class="wrap" role="img" aria-label={descripcion}>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.wrap {
		position: relative;
		height: 220px;
	}
</style>
