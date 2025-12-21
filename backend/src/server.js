import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import helmet from 'helmet';

import tileRoutes from './routes/tile-routes.js';
import authRoutes from './routes/auth-routes.js';
import contentRoutes from './routes/content-routes.js';
import layerStylesRoutes from './routes/layer-styles-routes.js';
import contaminantsRoutes from './routes/contaminants-routes.js';
import crmRoutes from './routes/crm-routes.js';
import adminCrudRoutes from './routes/admin-crud-routes.js';
import adminBusinessRoutes from './routes/admin-business-routes.js';
import customerRoutes from './routes/customer-routes.js';
import invitationRoutes from './routes/invitation-routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import waterQualityReportsRoutes from './routes/water-quality-reports-routes.js';
import { setRequestContext } from './middleware/auth-middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2018;

app.set('trust proxy', true);

const corsOptions = {
    origin: [
        'https://www.waterreportcard.com',
        'https://waterreportcard.com',
        'http://69.16.254.46:4001',
        'http://69.16.254.46:4000',
        'https://admin.waterreportcard.com',
        'http://admin.waterreportcard.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4000',
        'http://localhost:4001',
        'http://localhost:2018',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
};

app.use(cors(corsOptions));


//Resolve absoulte path to "public"
const __dirname = path.resolve();

//Serve static files from "public"
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(helmet());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(setRequestContext); // Set request context for audit logging

app.use('/tiles', tileRoutes);
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/layer-styles', layerStylesRoutes);
app.use('/contaminants', contaminantsRoutes);
app.use('/crm', crmRoutes);
app.use('/admin', adminCrudRoutes);
app.use('/admin/business', adminBusinessRoutes);
app.use('/customers', customerRoutes);
app.use('/invitations', invitationRoutes);
app.use('/contacts', contactsRoutes);
app.use('/search', searchRoutes);
app.use('/water-quality-reports', waterQualityReportsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})