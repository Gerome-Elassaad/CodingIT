import { Router } from 'express';

const router = Router();

// Placeholder for webhooks routes
router.post('/github', (req, res) => {
  res.json({ message: 'GitHub webhooks API - TODO: Convert from Next.js' });
});

export const webhooksRouter = router;