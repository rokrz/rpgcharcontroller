import type { CapacitorConfig } from "@capacitor/cli";

// Config do Capacitor pro APK Android.
//
// webDir = "www": pasta com a boot page (index.html) que: (a) inicia o Node
// embarcado via nodejs-mobile-cordova, (b) espera o evento server-ready,
// (c) redireciona pra http://127.0.0.1:<porta-dinamica> -- onde o Express
// embarcado ja esta servindo o frontend React real (copia de frontend/dist).

const config: CapacitorConfig = {
  appId: "com.innkeeper.app",
  appName: "InnKeeper",
  webDir: "www",
  // Permite navegar pra hosts http://localhost e 127.0.0.1 (servidor embarcado).
  server: {
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["localhost", "127.0.0.1"],
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#1a1a2e",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#e94560",
    },
  },
};

export default config;
