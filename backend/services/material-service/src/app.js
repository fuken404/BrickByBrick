require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');

const materialRoutes  = require('./routes/material.routes');
const solicitudRoutes = require('./routes/solicitud.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const { errorHandler, generalLimiter } = require('@brickbybrick/shared');

const app = express();

// Servir archivos subidos localmente
app.use('/uploads', express.static(require('path').resolve(__dirname, '../../../uploads')));

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(generalLimiter);

app.use('/api/v1/materiales',  materialRoutes);
app.use('/api/v1/solicitudes', solicitudRoutes);
app.use('/api/v1/categorias',  categoriaRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'material-service' }));

app.use(errorHandler);

module.exports = app;
