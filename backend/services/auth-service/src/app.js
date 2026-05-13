require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger.config');

const authRoutes   = require('./routes/auth.routes');
const { errorHandler, generalLimiter } = require('@brickbybrick/shared');

const app = express();

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
}));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limit general
app.use(generalLimiter);

// Documentación
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Error handler (debe ser último)
app.use(errorHandler);

module.exports = app;
