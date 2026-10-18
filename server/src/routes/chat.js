import { Router } from 'express';
import { validateChatInput } from '../middleware/validate.js';
import { chatRateLimiter } from '../middleware/rateLimit.js';
import { processChat } from '../services/chatService.js';

export const chatRouter = Router();

chatRouter.post('/chat', chatRateLimiter, validateChatInput, async (req, res, next) => {
  try {
    const { message, language, history } = req.body;
    const result = await processChat({
      message,
      language,
      history
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
