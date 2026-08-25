'use client';

import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, Plus } from 'lucide-react';
import { aiChatApi, ChatMessage } from '@/features/ai-chat/api/ai-chat.api';
import { getApiErrorMessage } from '@/utils/api-error';
import { useToast } from '@/components/toast/ToastProvider';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ASSISTANT',
  content:
    'Hello Admin! I am Vasanthi AI Assistant. Ask me about catalog analytics, order summaries, stock alerts, or customer query assistance.',
  tokenCount: 0,
  createdAt: new Date().toISOString(),
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AdminAiChatPage() {
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentQuery = input.trim();
    if (!currentQuery || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'USER',
      content: currentQuery,
      tokenCount: 0,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const conversation = await aiChatApi.createConversation(currentQuery.slice(0, 60));
        activeConversationId = conversation.id;
        setConversationId(activeConversationId);
      }

      const reply = await aiChatApi.sendMessage(activeConversationId, currentQuery);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      toast('error', 'AI Assistant unavailable', getApiErrorMessage(err));
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(currentQuery);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-[#0284c7]" />
            <span>Admin AI Assistant Chat Console</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            AI copilot for store operations, inventory queries, order summaries & business analytics.
          </p>
        </div>

        <button
          onClick={handleNewChat}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4 text-neutral-500" />
          <span>New Chat Session</span>
        </button>
      </div>

      {/* Chat Console Area */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-2xs flex flex-col h-[550px]">

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FDFBFB]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 max-w-2xl ${
                m.role === 'USER' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                m.role === 'USER' ? 'bg-neutral-900 text-white' : 'bg-[#0284c7] text-white shadow-2xs'
              }`}>
                {m.role === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                m.role === 'USER'
                  ? 'bg-neutral-900 text-white rounded-tr-xs'
                  : 'bg-white border border-neutral-200/80 text-neutral-800 shadow-2xs rounded-tl-xs'
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <span className={`text-[9.5px] block text-right font-medium ${
                  m.role === 'USER' ? 'text-neutral-400' : 'text-neutral-400'
                }`}>
                  {formatTime(m.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium italic pl-11">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#0284c7]" />
              <span>Vasanthi AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
          <input
            type="text"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI assistant (e.g. 'Show revenue breakdown for Banarasi sarees this week')..."
            className="flex-1 border border-neutral-300 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#0284c7] hover:bg-[#0B3B78] text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

      </div>

    </div>
  );
}
