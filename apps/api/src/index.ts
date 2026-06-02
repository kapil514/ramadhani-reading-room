import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import enquiriesRouter from './routes/enquiries';
import studentsRouter from './routes/students';
import cabinsRouter from './routes/cabins';
import lockersRouter from './routes/lockers';
import paymentsRouter from './routes/payments';
import reportsRouter from './routes/reports';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/cabins', cabinsRouter);
app.use('/api/lockers', lockersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reports', reportsRouter);

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});

export default app;
