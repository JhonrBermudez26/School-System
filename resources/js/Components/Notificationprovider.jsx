import { createContext, useContext, useState, useEffect, useRef } from 'react';

const NotificationContext = createContext();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children, user }) {
  const [isEchoReady, setIsEchoReady] = useState(false);
  const echoCheckInterval = useRef(null);

  // Verificar si Echo está listo
  useEffect(() => {
    const checkEcho = () => {
      if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
        const state = window.Echo.connector.pusher.connection.state;
        if (state === 'connected') {
          console.log('✅ Echo está listo y conectado');
          setIsEchoReady(true);
          if (echoCheckInterval.current) {
            clearInterval(echoCheckInterval.current);
          }
        }
      }
    };

    // Verificar inmediatamente
    checkEcho();

    // Verificar cada 500ms hasta que esté listo
    echoCheckInterval.current = setInterval(checkEcho, 500);

    // Cleanup
    return () => {
      if (echoCheckInterval.current) {
        clearInterval(echoCheckInterval.current);
      }
    };
  }, []);

  // Log del estado
  useEffect(() => {
    if (isEchoReady && user) {
      console.log('🔔 Sistema de notificaciones global inicializado');
      console.log('👤 Usuario:', user?.name);
      console.log('📊 Grupos:', user?.groups?.length || 0);
    }
  }, [isEchoReady, user]);

  const value = {
    isEchoReady,
    user,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}