export function validateChatInput(req, res, next) {
  const { message, language, history } = req.body || {};

  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Message is required and must be a non-empty string.'
      }
    });
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > 1000) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Message cannot exceed 1000 characters.'
      }
    });
  }

  if (language !== 'en' && language !== 'hi') {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Language must be either "en" or "hi".'
      }
    });
  }

  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'History must be an array of prior turns.'
        }
      });
    }

    if (history.length > 4) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'History cannot exceed 4 items.'
        }
      });
    }

    for (let i = 0; i < history.length; i++) {
      const turn = history[i];
      if (!turn || typeof turn !== 'object') {
        return res.status(400).json({
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: `History turn #${i} must be an object.`
          }
        });
      }
      if (turn.role !== 'user' && turn.role !== 'assistant') {
        return res.status(400).json({
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: `History turn #${i} role must be "user" or "assistant".`
          }
        });
      }
      if (typeof turn.content !== 'string') {
        return res.status(400).json({
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: `History turn #${i} content must be a string.`
          }
        });
      }
      // Auto-truncate history turns over 1000 chars gracefully so client follow-up turns never break
      if (turn.content.length > 1000) {
        turn.content = turn.content.slice(0, 1000);
      }
    }
  }

  req.body.message = trimmedMessage;
  next();
}
