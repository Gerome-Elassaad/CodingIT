import { Router } from 'express';

const router = Router();

// Placeholder for terminal routes
router.post('/', (req, res) => {
  res.json({ message: 'Terminal API - TODO: Convert from Next.js' });
});

export const terminalRouter = router;