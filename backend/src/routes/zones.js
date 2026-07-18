import { Router } from 'express';
import { getZones, getZoneById, getReportsByZone } from '../models/store.js';
import { fuseZone } from '../services/fusionEngine.js';

const router = Router();

router.get('/', (req, res) => {
  const zones = getZones();
  const now = new Date();
  const states = zones.map(zone => ({
    zone,
    state: fuseZone(zone.id, getReportsByZone(zone.id), now),
  }));
  res.json(states);
});

router.get('/:id', (req, res) => {
  const zone = getZoneById(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  const state = fuseZone(zone.id, getReportsByZone(zone.id), new Date());
  res.json({ zone, state });
});

export default router;
