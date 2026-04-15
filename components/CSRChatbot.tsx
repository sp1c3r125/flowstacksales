import React, { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  'What package fits my clinic?',
  'What is the pricing?',
  'What is included in Growth?',
  'What happens after I book?'
];

export const CSRChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I only help with Flowstack OS, packages, pricing, fit, and setup. For the exact recommendation, use the form above.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const trimmed = input.trim();
    const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-6).map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `API Error: ${response.status}`);
      }

      const assistantReply = data?.choices?.[0]?.message?.content || 'I can help with Flowstack OS, packages, pricing, fit, and setup. For the exact recommendation, use the form above.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantReply,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I had a connection issue. I can still help with Flowstack packages, pricing, fit, and setup once the chat reconnects.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(8,24,47,0.96),rgba(3,11,29,0.98))] p-4 text-cyan-100 shadow-[0_18px_45px_rgba(2,8,23,0.55)] transition-all duration-200 hover:scale-105 hover:border-cyan-300/45"
          aria-label="Open Flowstack quick help"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-96 flex-col overflow-hidden rounded-2xl border border-cyan-400/20 bg-[linear-gradient(145deg,rgba(8,24,47,0.96),rgba(4,13,34,0.98)_45%,rgba(3,11,29,0.99))] shadow-[0_22px_60px_rgba(2,8,23,0.62)] backdrop-blur-xl">
          <div className="border-b border-cyan-400/14 bg-[linear-gradient(90deg,rgba(10,36,73,0.92),rgba(8,24,47,0.78))] px-4 py-4 text-cyan-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[1.05rem] font-bold">Flowstack Quick Help</h3>
                <p className="mt-1 text-xs text-cyan-100/78">
                  Flowstack packages, pricing, fit, and setup only. Use the form above for the full recommendation.
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-cyan-100/72 transition-colors hover:text-white" aria-label="Close chat">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          

          <div className="flex-1 space-y-4 overflow-y-auto bg-transparent px-4 py-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[84%] rounded-2xl border p-3 ${
                      isUser
                        ? 'border-blue-300/45 bg-blue-950 text-white shadow-[0_10px_30px_rgba(30,64,175,0.28)]'
                        : 'border-cyan-400/14 bg-[linear-gradient(135deg,rgba(8,24,47,0.82),rgba(3,11,29,0.9))] text-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    <p className={`mt-1 text-[11px] ${isUser ? 'text-blue-100/80' : 'text-cyan-100/42'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-cyan-400/14 bg-[linear-gradient(135deg,rgba(8,24,47,0.82),rgba(3,11,29,0.9))] p-3">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300/70"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300/70" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300/70" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="border-t border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,47,0.18),rgba(3,11,29,0.26))] px-4 py-3">
              <p className="mb-2 text-xs text-cyan-100/58">Quick questions:</p>
              <div className="space-y-1">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => setInput(question)}
                    className="block w-full text-left text-xs text-cyan-300/88 transition-colors hover:text-cyan-200"
                  >
                    • {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-cyan-400/12 bg-[linear-gradient(180deg,rgba(6,17,38,0.9),rgba(3,11,29,0.96))] p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about Flowstack package fit or pricing..."
                className="flex-1 rounded-xl border border-cyan-400/16 bg-[#081225]/88 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/36 focus:ring-2 focus:ring-cyan-400/18"
                disabled={isLoading}
                maxLength={400}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="rounded-xl border border-blue-400/24 bg-blue-600/90 px-4 py-2.5 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:border-slate-700/50 disabled:bg-slate-700/60"
                aria-label="Send message"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
