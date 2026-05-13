require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');

const eventoRoutes = require('./routes/evento.routes');
const { errorHandler, generalLimiter } = require('@brickbybrick/shared');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(generalLimiter);

app.use('/api/v1/eventos', eventoRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'event-service' }));
app.use(errorHandler);

module.exports = app;
