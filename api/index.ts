import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/src/serverless';

// This is the main serverless function entry point for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}