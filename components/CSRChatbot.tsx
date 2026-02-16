import React, { useState, useRef, useEffect } from 'react';
import { defaultKnowledgeBase } from '../services/knowledgeBase';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const CSRChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I'm here for quick questions about FlowStackOS. For a detailed proposal tailored to your needs, use the form above. What would you like to know?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const kb = defaultKnowledgeBase;

            const systemPrompt = `You are the FlowStackOS Virtual Assistant - a helpful chatbot for quick questions.

CRITICAL RULES:
- Keep ALL responses VERY SHORT (2-3 sentences maximum)
- Give brief overview info only, NOT detailed explanations
- Direct users to the proposal generator for complete information
- Be conversational and friendly, not sales-pushy
- If asked for detailed info, say "For a full breakdown, generate a proposal using the form above"

COMPANY: ${kb.companyInfo.name}
WHAT WE DO: ${kb.companyInfo.coreOffering}

QUICK INFO TO SHARE:
**Products:**
- FlowStackOS Full (₱450K) - Complete automation system
- BookedOS (₱85K) - Lead capture & booking
- Landing Page Only (₱25K) - Single conversion page
- AI CSR Voice Agent - Custom pricing

**Timeline:** 3 weeks standard
**Payment:** 50% to start, 50% before go-live
**Support:** ₱15K/month ongoing

**Stack:** n8n, Airtable, Slack, Gmail
**Key Feature:** You own everything via automation@yourdomain.com

CONVERSATION STYLE:
✅ "BookedOS costs ₱85K and takes 2 weeks. Want details? Generate a proposal above!"
✅ "We use n8n, Airtable, Slack, and Gmail. The full architecture is in the proposal."
✅ "3 weeks total. Week 1 is setup, Week 2 is automation, Week 3 is launch."

❌ Don't write long paragraphs
❌ Don't explain every detail
❌ Don't list every feature - just mention key points

WHEN ASKED FOR DETAILS:
Respond with: "That's covered in detail in the proposal. Fill out the form above to get a custom breakdown for your situation!"

Remember: You're for QUICK questions. The proposal generator is for DETAILED information.`;

            const conversationHistory = messages.slice(-6).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversationHistory,
                        { role: 'user', content: input }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Could you rephrase your question?",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: "I'm having trouble connecting. Try the proposal form above for detailed info!",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const suggestedQuestions = [
        "What's the pricing?",
        "How long does it take?",
        "What tools do you use?",
        "What's the sovereignty model?"
    ];

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50"
                    aria-label="Open chat"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ?
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Quick Help</h3>
                            <p className="text-xs text-blue-100">For full details, generate a proposal ↑</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 transition-colors"
                            aria-label="Close chat"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-800 border border-gray-200'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions */}
                    {messages.length <= 2 && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                            <div className="space-y-1">
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(question)}
                                        className="text-xs text-left text-blue-600 hover:text-blue-700 hover:underline block w-full"
                                    >
                                        • {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Quick question..."
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-colors"
                            >
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
