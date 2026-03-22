import React, { useState, useRef, useEffect } from 'react';
import { defaultKnowledgeBase } from '../services/knowledgeBase';
import { packageOrder, serviceCatalog } from '../services/catalog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const CSRChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Ask me a quick question about packages, pricing, or fit. For the exact recommendation, use the form above.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const kb = defaultKnowledgeBase;
      const packageLines = packageOrder
        .map((key) => {
          const pkg = serviceCatalog[key];
          return `- ${pkg.name}: ${pkg.setup}; ${pkg.monthly}${pkg.altPricing ? `; ${pkg.altPricing}` : ''}`;
        })
        .join('\n');

      const systemPrompt = `You are the Flowstack quick-response assistant.

Rules:
- Keep responses under 3 short paragraphs.
- Be direct.
- Answer with official package names only: Flowstack Lite Kit, Starter, Growth, Scale.
- Mention package limits when relevant.
- Do not promise custom builds or unlimited scope.
- For anything detailed, tell the user to use the recommendation form above.

Company: ${kb.companyInfo.name}
Core offering: ${kb.companyInfo.coreOffering}

Packages:
${packageLines}

Allowed guidance:
- Lite = simple auto-replies and lead capture
- Starter = 1 lead source, 1 booking outcome, 1 pipeline
- Growth = daily inquiries, follow-up discipline, up to 2 pipelines
- Scale = multi-channel routing, escalation, operator control`;

      const conversationHistory = messages
        .slice(-6)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: input },
          ],
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.choices?.[0]?.message?.content ||
            'I could not process that. Use the form above and I’ll map you to the right package.',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I had a connection issue. For the exact package recommendation, use the form above.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What package fits me?',
    'What is the pricing?',
    'What is included in Growth?',
    'When should I choose Scale?',
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full border border-blue-300/20 bg-[linear-gradient(180deg,rgba(24,88,214,0.95)_0%,rgba(16,66,181,0.98)_100%)] p-4 text-white shadow-[0_14px_30px_rgba(8,47,120,0.45)] transition-all duration-200 hover:scale-110 hover:border-cyan-300/50 hover:shadow-[0_18px_36px_rgba(8,47,120,0.5)]"
          aria-label="Open chat"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-96 flex-col overflow-hidden rounded-2xl border border-blue-300/16 bg-[linear-gradient(160deg,rgba(10,24,47,0.97)_0%,rgba(7,18,39,0.96)_40%,rgba(3,11,29,0.98)_100%)] shadow-[0_18px_70px_rgba(2,12,27,0.58),0_0_0_1px_rgba(34,211,238,0.03)] backdrop-blur-md">
          <div className="relative flex items-start justify-between border-b border-blue-300/10 bg-[linear-gradient(180deg,rgba(12,32,67,0.9)_0%,rgba(5,14,31,0.86)_100%)] p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.08),transparent_40%)]" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-slate-50">Flowstack Quick Help</h3>
              <p className="text-xs text-cyan-100/72">
                Packages, pricing, and fit. Use the form above for the full recommendation.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 text-slate-100/85 transition-colors hover:text-cyan-200"
              aria-label="Close chat"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(7,18,39,0.55)_0%,rgba(3,11,29,0.74)_100%)] p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl border p-3 ${
                    message.role === 'user'
                      ? 'border-blue-300/16 bg-[linear-gradient(180deg,rgba(31,97,214,0.92)_0%,rgba(25,72,178,0.96)_100%)] text-white shadow-[0_8px_22px_rgba(10,52,143,0.28)]'
                      : 'border-blue-300/12 bg-[linear-gradient(180deg,rgba(10,24,47,0.96)_0%,rgba(4,12,29,0.96)_100%)] text-slate-100 shadow-[0_0_0_1px_rgba(34,211,238,0.02)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <p
                    className={`mt-1 text-xs ${
                      message.role === 'user' ? 'text-blue-100/80' : 'text-cyan-100/45'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-blue-300/12 bg-[linear-gradient(180deg,rgba(10,24,47,0.96)_0%,rgba(4,12,29,0.96)_100%)] p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.02)]">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300/75" />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-300/75"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-300/75"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="border-t border-blue-300/10 bg-[linear-gradient(180deg,rgba(7,18,39,0.8)_0%,rgba(3,11,29,0.92)_100%)] px-4 py-3">
              <p className="mb-2 text-xs text-cyan-100/55">Quick questions:</p>
              <div className="space-y-1">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="block w-full text-left text-xs text-cyan-300 transition-colors hover:text-cyan-200 hover:underline"
                  >
                    • {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-b-2xl border-t border-blue-300/10 bg-[linear-gradient(180deg,rgba(8,21,45,0.94)_0%,rgba(3,11,29,0.98)_100%)] p-4">
            <div className="flex space-x-2">
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
                placeholder="Ask about package fit or pricing..."
                className="flex-1 rounded-lg border border-blue-300/14 bg-[linear-gradient(180deg,rgba(10,24,47,0.98)_0%,rgba(4,12,29,0.98)_100%)] px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-400/20"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="rounded-lg border border-blue-300/20 bg-[linear-gradient(180deg,rgba(31,97,214,0.95)_0%,rgba(20,71,184,0.98)_100%)] px-4 py-2 text-white transition-all hover:border-cyan-300/55 hover:shadow-[0_0_18px_rgba(37,99,235,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
