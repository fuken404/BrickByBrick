const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'BrickByBrick — Auth Service',
      version:     '1.0.0',
      description: 'API de autenticación: registro, login, JWT, reset de contraseña',
    },
    servers: [{ url: `http://localhost:${process.env.PORT_AUTH || 3001}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        RegisterBeneficiario: {
          type: 'object',
          required: ['email', 'password', 'nombreCompleto', 'cedula'],
          properties: {
            email:          { type: 'string', format: 'email' },
            password:       { type: 'string', minLength: 8 },
            nombreCompleto: { type: 'string' },
            cedula:         { type: 'string' },
            localidadId:    { type: 'integer' },
            estrato:        { type: 'integer', minimum: 1, maximum: 6 },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
