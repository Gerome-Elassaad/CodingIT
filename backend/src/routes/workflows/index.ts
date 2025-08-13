import { Router } from 'express';

const router = Router();

// Placeholder for workflows routes
router.get('/', (req, res) => {
  res.json({ message: 'Workflows API - TODO: Convert from Next.js' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Workflow ${req.params.id} - TODO: Convert from Next.js` });
});

router.post('/:id/execute', (req, res) => {
  res.json({ message: `Execute workflow ${req.params.id} - TODO: Convert from Next.js` });
});

export const workflowsRouter = router;