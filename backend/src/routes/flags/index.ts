import { Router } from 'express';

const router = Router();

// Placeholder for flags routes
router.get('/', (req, res) => {
  res.json({ message: 'Flags API - TODO: Convert from Next.js' });
});

export const flagsRouter = router;