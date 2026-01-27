import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Bot,
    Info,
    RefreshCw,
    Send,
    Stethoscope,
    Trash2,
    User
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatbotAPI } from '../services/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `👋 Hello! I'm the **HealthTriage AI Assistant**.

I'm here to help you with **healthcare-related questions only**. I can provide general health information about:

- 🏥 Common health conditions and symptoms
- 💊 General wellness and prevention tips
- 🩺 Understanding vital signs and health metrics
- 🚨 When to seek medical attention
- 🧠 Mental health awareness

**Important:** I am NOT a substitute for professional medical advice. For any health concerns, please consult a qualified healthcare professional.

How can I assist you today?`,
      timestamp: new Date()
    }]);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotAPI.sendMessage({
        message: input,
        sessionId
      });

      const { data } = response.data;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        isHealthcareRelated: data.isHealthcareRelated,
        timestamp: new Date(data.timestamp)
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await chatbotAPI.clearHistory(sessionId);
      setMessages([{
        role: 'assistant',
        content: 'Chat cleared. How can I help you with healthcare-related questions?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const quickQuestions = [
    "What are normal vital signs?",
    "Symptoms of high blood pressure?",
    "When should I see a doctor for fever?",
    "Tips for better sleep"
  ];

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">Healthcare AI Assistant</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ask me anything about health & wellness</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="btn-secondary flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Chat
        </button>
      </div>

      {/* Notice Banner */}
      <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>
          <strong>Healthcare Questions Only:</strong> I can only answer health-related questions. 
          Non-healthcare queries will be politely declined.
        </span>
      </div>

      {/* Chat Container */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : message.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-bl-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'
                  }`}>
                    {message.role === 'user' ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a healthcare question..."
              className="input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-4"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            <Info className="w-3 h-3 inline mr-1" />
            This AI provides general health information only, not medical advice.
          </p>
        </form>
      </div>
    </div>
  );
}
