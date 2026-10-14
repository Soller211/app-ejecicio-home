import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.soller211.mientreno',
	appName: 'Mi Entreno',
	// Sitio estático que genera `npm run build` (adapter-static).
	webDir: 'build',
	android: {
		backgroundColor: '#0f1115'
	}
};

export default config;
