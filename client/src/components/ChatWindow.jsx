import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, AlertTriangle, Sparkles, Scale, Info } from 'lucide-react';
import { MessageBubble } from './MessageBubble.jsx';

export function ChatWindow({ chat, t, lang }) {
  const { messages, loading, error, sendMessage, retryLast, clearChat } = chat;
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const msg = inputText.trim();
    setInputText('');
    sendMessage(msg, lang);
  };

  /**
   * IME-safe Enter-to-submit handler per modern web guidance.
   * Prevents premature submission while user is typing in Devanagari / IME.
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Guard against IME composition
      if (e.isComposing || e.keyCode === 229) {
        return;
      }

      handleSubmit();
    }
  };

  const handleSelectFollowUp = (query) => {
    sendMessage(query, lang);
  };

  return (
    <section id="guidance" aria-label="Legal Guidance Interface" className="py-12 bg-slate-50 min-h-[600px] flex flex-col justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[580px]">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">{t.chat.title}</h2>
                <p className="text-xs text-slate-300 hidden sm:block">{t.chat.subtitle}</p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-sky-400"
                title="Start a fresh conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.chat.newChatBtn}</span>
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[500px]" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-100 shadow-xs">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">
                  {lang === 'hi' ? "नमस्ते! मैं NyayaSetu_AI हूँ।" : "Welcome to NyayaSetu_AI"}
                </h3>
                <p className="text-sm max-w-md text-slate-600 mb-6">
                  {t.chat.emptyPrompt}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>{t.chat.disclaimer}</span>
                </div>
              </div>
            ) : (
              messages.map(m => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  t={t}
                  onSelectFollowUp={handleSelectFollowUp}
                />
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 w-fit">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-700 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs font-medium text-slate-600">{t.chat.sendingBtn}</span>
              </div>
            )}

            {/* Error State with Retry */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                {retryLast && (
                  <button
                    type="button"
                    onClick={retryLast}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                  >
                    {t.chat.retryBtn}
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="relative">
              <label htmlFor="chat-input" className="sr-only">
                {t.chat.title}
              </label>
              <textarea
                id="chat-input"
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
                onKeyDown={handleKeyDown}
                placeholder={t.chat.inputPlaceholder}
                rows={3}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3.5 pr-24 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className={`text-[10px] ${inputText.length > 900 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                  {inputText.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  id="chat-submit-btn"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <span>{t.chat.sendBtn}</span>
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>
            </form>

            <div className="mt-2 text-center text-[11px] text-slate-500">
              {t.chat.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
