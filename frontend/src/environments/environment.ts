/**
 * Desarrollo: el dev-server de Angular redirige /api, /uploads y /ws al
 * API Gateway (proxy.conf.json), así todo queda en el mismo origen.
 */
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  assetsUrl: '',
  wsUrl: '',
  wsPath: '/ws/notificaciones',
};
