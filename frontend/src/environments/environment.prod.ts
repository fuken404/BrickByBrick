/**
 * Producción: el frontend se sirve detrás del mismo dominio que el gateway
 * (reverse proxy), por lo que las rutas relativas funcionan igual.
 */
export const environment = {
  production: true,
  apiUrl: '/api/v1',
  assetsUrl: '',
  wsUrl: '',
  wsPath: '/ws/notificaciones',
};
