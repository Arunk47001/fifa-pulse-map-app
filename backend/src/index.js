import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import zonesRouter from './routes/zones.js';
import reportsRouter from './routes/reports.js';
import askRouter from './routes/ask.js';
import pulseRouter from './routes/pulse.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/zones', zonesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ask', askRouter);
app.use('/api/pulse', pulseRouter);

app.listen(PORT, () => {
  console.log(`PulseMap backend running on port ${PORT}`);
});
