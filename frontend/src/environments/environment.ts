export const environment = {
  production: false,
  services: {
    auth:      'http://localhost:3001/api/v1',
    users:     'http://localhost:3002/api/v1',
    materials: 'http://localhost:3003/api/v1',
    events:    'http://localhost:3004/api/v1',
    pubs:      'http://localhost:3005/api/v1',
    notif:     'http://localhost:3006/api/v1',
  },
  wsUrl: 'http://localhost:3006',
  wsPath: '/ws/notificaciones',
};
