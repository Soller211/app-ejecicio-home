import type { Sesion, SerieRegistrada } from './db';

export const hoyISO = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const fechaCorta = (iso: string) =>
	new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('es-MX', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});

export const duracion = (seg: number) => {
	const s = Math.max(0, Math.round(seg));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const r = s % 60;
	if (h) return `${h}h ${m}min`;
	return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const minutosSesion = (s: Sesion) =>
	Math.round((new Date(s.fin).getTime() - new Date(s.inicio).getTime()) / 60000);

export const seriesHechas = (s: Sesion) =>
	s.ejercicios.reduce((n, e) => n + e.series.filter((x) => x.hecha).length, 0);

/** Volumen = suma de reps × peso (solo series con peso). */
export const volumenSerie = (x: SerieRegistrada) => (x.hecha ? (x.reps ?? 0) * (x.peso ?? 0) : 0);

export const volumenSesion = (s: Sesion) =>
	s.ejercicios.reduce((v, e) => v + e.series.reduce((a, x) => a + volumenSerie(x), 0), 0);

/** Fórmula de Epley para estimar 1RM. */
export const unoRM = (peso: number, reps: number) => (reps <= 1 ? peso : peso * (1 + reps / 30));

/** Lunes de la semana de una fecha, como clave YYYY-MM-DD. */
export const inicioSemana = (d: Date) => {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
	return x;
};

/** Semanas consecutivas (hasta la actual) con al menos un entreno. */
export const rachaSemanas = (sesiones: Sesion[]) => {
	const semanas = new Set(sesiones.map((s) => inicioSemana(new Date(s.inicio)).getTime()));
	let cursor = inicioSemana(new Date());
	if (!semanas.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7); // la semana actual aún cuenta
	let n = 0;
	while (semanas.has(cursor.getTime())) {
		n++;
		cursor.setDate(cursor.getDate() - 7);
	}
	return n;
};

export const descargar = (nombre: string, contenido: string, tipo = 'application/json') => {
	const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
	const a = document.createElement('a');
	a.href = url;
	a.download = nombre;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const vibrar = (patron: number | number[]) => {
	try {
		navigator.vibrate?.(patron);
	} catch {
		/* no soportado */
	}
};

/** Pitido corto con WebAudio para avisar fin de descanso. */
export const pitido = () => {
	try {
		const ctx = new AudioContext();
		const o = ctx.createOscillator();
		const g = ctx.createGain();
		o.frequency.value = 880;
		g.gain.setValueAtTime(0.2, ctx.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
		o.connect(g).connect(ctx.destination);
		o.start();
		o.stop(ctx.currentTime + 0.4);
		o.onended = () => ctx.close();
	} catch {
		/* sin audio */
	}
};
