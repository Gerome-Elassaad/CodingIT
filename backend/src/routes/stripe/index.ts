import { Router } from 'express';

const router = Router();

// Placeholder for stripe routes
router.post('/checkout', (req, res) => {
  res.json({ message: 'Stripe checkout API - TODO: Convert from Next.js' });
});

router.post('/portal', (req, res) => {
  res.json({ message: 'Stripe portal API - TODO: Convert from Next.js' });
});

router.post('/webhooks', (req, res) => {
  res.json({ message: 'Stripe webhooks API - TODO: Convert from Next.js' });
});

export const stripeRouter = router;