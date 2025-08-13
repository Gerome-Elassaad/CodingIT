import { Router } from 'express';

const router = Router();

// Placeholder for edge-flags routes
router.get('/', (req, res) => {
  res.json({ message: 'Edge flags API - TODO: Convert from Next.js' });
});

export const edgeFlagsRouter = router;