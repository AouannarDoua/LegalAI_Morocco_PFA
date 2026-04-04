import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Paperclip, Search, Info, Scale } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour Ahmed ! Je suis votre assistant juridique IA. Comment puis-je vous aider aujourd'hui ? Je peux vous aider à analyser un contrat, répondre à des questions sur le code du travail marocain ou rechercher des décisions de justice.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "D'après l'article 39 du Code du Travail marocain, la faute grave peut justifier un licenciement immédiat sans indemnités de préavis ni de dommages-intérêts. Cependant, la procédure disciplinaire prévue par les articles 62 à 65 doit être scrupuleusement respectée (entretien préalable, notification dans les délais, etc.).",
        timestamp: new Date(),
        sources: ['Code du Travail - Article 39', 'Cour de Cassation - Décision 2023/156']
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Assistant Juridique IA</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-emerald-600 font-medium">En ligne</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-3xl",
              message.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              message.role === 'assistant' ? "bg-blue-900 text-white" : "bg-indigo-600 text-white"
            )}>
              {message.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="space-y-2">
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                message.role === 'assistant' 
                  ? "bg-white text-gray-800 border border-gray-100 rounded-tl-none" 
                  : "bg-indigo-600 text-white rounded-tr-none"
              )}>
                {message.content}
              </div>
              {message.sources && (
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                      <Scale className="w-3 h-3" />
                      {source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question juridique ici..."
            className="w-full pl-12 pr-24 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
          <button 
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-blue-900 text-white p-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-widest">
          Propulsé par LegalAI Morocco • L'IA peut faire des erreurs, vérifiez les sources.
        </p>
      </footer>
    </div>
  );
}
