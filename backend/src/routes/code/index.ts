import { Router } from 'express';
import { evaluateCode } from '@/app/api/chat/codeInterpreter'

const router = Router();

// Code execution endpoint - POST /api/code/execute
router.post('/execute', async (req, res) => {
  try {
    const { sessionID, code } = req.body

    if (!sessionID || !code) {
      return res.status(400).json({
        error: 'sessionID and code are required'
      });
    }

    const result = await evaluateCode(sessionID, code)
    return res.json(result)
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred'
    });
  }
});

export const codeRouter = router;