import axios from "axios";
window.axios = axios;
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
    enabledTransports: ["ws", "wss"],
    disableStats: true,
});

// ✅ Logs de debug
console.log("🔍 Echo inicializado:", window.Echo);
console.log("🔍 Configuración Reverb:", {
    key: import.meta.env.VITE_REVERB_APP_KEY,
    host: import.meta.env.VITE_REVERB_HOST,
    port: import.meta.env.VITE_REVERB_PORT,
    scheme: import.meta.env.VITE_REVERB_SCHEME,
});

// ✅ Listener global de estado de conexión
window.Echo.connector.pusher.connection.bind('state_change', (states) => {
    console.log('🔌 Estado de conexión Reverb:', states.current);
});

window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Conectado a Reverb exitosamente');
});

window.Echo.connector.pusher.connection.bind('disconnected', () => {
    console.warn('⚠️ Desconectado de Reverb');
});

window.Echo.connector.pusher.connection.bind('error', (error) => {
    console.error('❌ Error de conexión Reverb:', error);
});