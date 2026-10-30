import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/api.js';

export function useChat(initialLanguage = 'en') {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const sendMessage = useCallback(async (text, lang = initialLanguage) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLastFailedMessage(null);

    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Build history for backend (last 4 turns, cap content to 900 chars to avoid payload overflow)
    const historyPayload = messages.slice(-4).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.slice(0, 900) : ''
    }));

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: trimmed,
        language: lang,
        history: historyPayload
      });

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: response.answer,
        steps: response.steps || [],
        sources: response.sources || [],
        evidenceLevel: response.evidenceLevel,
        needsClarification: response.needsClarification,
        followUpQuestions: response.followUpQuestions || [],
        limitations: response.limitations,
        outdatedWarning: response.outdatedWarning,
        referral: response.referral,
        emergency: response.emergency,
        mode: response.mode,
        safetyNotice: response.safetyNotice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Failed to receive guidance. Please retry.');
      setLastFailedMessage(trimmed);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, initialLanguage]);

  const retryLast = useCallback(() => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage, initialLanguage);
    }
  }, [lastFailedMessage, initialLanguage, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);
  }, []);

  return {
    messages,
    loading,
    error,
    lastFailedMessage,
    sendMessage,
    retryLast,
    clearChat
  };
}
