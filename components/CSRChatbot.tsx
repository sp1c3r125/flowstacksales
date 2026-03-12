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
      content: 'Ask me a quick question about packages, pricing, or fit. For the exact recommendation, use the form above.',
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

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const kb = defaultKnowledgeBase;
      const packageLines = packageOrder.map((key) => {
        const pkg = serviceCatalog[key];
        return `- ${pkg.name}: ${pkg.setup}; ${pkg.monthly}${pkg.altPricing ? `; ${pkg.altPricing}` : ''}`;
      }).join('\n');

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

      const conversationHistory = messages.slice(-6).map(msg => ({ role: msg.role, content: msg.content }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory, { role: 'user', content: input }] })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'I could not process that. Use the form above and I’ll map you to the right package.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I had a connection issue. For the exact package recommendation, use the form above.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What package fits me?',
    'What is the pricing?',
    'What is included in Growth?',
    'When should I choose Scale?'
  ];

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50" aria-label="Open chat">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Flowstack Quick Help</h3>
              <p className="text-xs text-blue-100">Packages, pricing, and fit. Use the form above for the full recommendation.</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors" aria-label="Close chat">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && <div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-lg p-3"><div className="flex space-x-2"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div></div></div></div>}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="space-y-1">
                {suggestedQuestions.map((question, index) => (
                  <button key={index} onClick={() => setInput(question)} className="text-xs text-left text-blue-600 hover:text-blue-700 hover:underline block w-full">• {question}</button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about package fit or pricing..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
