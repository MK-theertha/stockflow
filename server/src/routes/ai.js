import { Router } from 'express';

import { json, route } from '../lib/api.js';
import { runAi } from '../lib/ai.js';

const router = Router();

// Any logged-in user may use the assistant; it does not need a subscription.
router.post(
  '/',
  route(async ({ body }) => json({ text: await runAi(body.prompt) }), { subscription: false })
);

export default router;
