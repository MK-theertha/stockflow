import { GoogleGenerativeAI } from '@google/generative-ai';

import { config } from '../config.js';
import { HttpError } from './api.js';

const MAX_PROMPT_LENGTH = 4000;

export async function runAi(prompt) {
  const text = String(prompt ?? '').trim();
  if (!text) throw new HttpError(400, 'Prompt is empty');
  if (text.length > MAX_PROMPT_LENGTH) throw new HttpError(400, 'Prompt is too long');

  const genAI = new GoogleGenerativeAI(config.googleApiKey);
  const model = genAI.getGenerativeModel({ model: config.geminiModel });
  const result = await model.generateContent(text);
  return result.response.text();
}
