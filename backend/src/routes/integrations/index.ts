import { Router } from 'express';

const router = Router();

// Placeholder for integrations routes
router.get('/github/repos', (req, res) => {
  res.json({ message: 'GitHub repos API - TODO: Convert from Next.js' });
});

router.get('/github/repos/:owner/:repo', (req, res) => {
  res.json({ message: `GitHub repo ${req.params.owner}/${req.params.repo} - TODO: Convert from Next.js` });
});

router.post('/github/import', (req, res) => {
  res.json({ message: 'GitHub import API - TODO: Convert from Next.js' });
});

export const integrationsRouter = router;