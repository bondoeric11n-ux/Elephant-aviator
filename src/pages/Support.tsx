import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export default function Support() {
  const { user } = useAuth();
  const { rooms, sendMessage, markAsRead, getRoomForUser } = useChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const room = user ? getRoomForUser(user.id) : undefined;

  useEffect(() => {
    if (room && user) {
      markAsRead(room.id);
    }
  }, [room?.messages.length]);

  // Auto-refresh to see new admin messages
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages.length, refreshKey]);

  const handleSend = () => {
    if (!message.trim() || !user) return;
    sendMessage(user.id, user.username, message, user.id, user.username, 'user');
    setMessage('');
    setRefreshKey(k => k + 1);
  };

  const quickMessages = [
    "I need help with my account",
    "How do I place a bet?",
    "I have a question about cashing out",
    "I'm experiencing a technical issue",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span>💬</span> Support Chat
        </h2>
        <p className="text-gray-400 mt-1">Get help from our support team</p>
      </div>

      <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center">
            <span className="text-lg">🐘</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Elephant Support</h3>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!room || room.messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">💬</span>
              <p className="text-gray-400 text-lg mb-2">Start a conversation</p>
              <p className="text-gray-500 text-sm mb-6">Our support team is here to help you</p>

              <div className="space-y-2 max-w-sm mx-auto">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Quick messages:</p>
                {quickMessages.map((qm, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(qm)}
                    className="w-full text-left px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    {qm}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            room.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.senderRole === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-gray-700 text-gray-200 rounded-bl-md'
                }`}>
                  {msg.senderRole === 'admin' && (
                    <p className="text-xs font-bold text-indigo-400 mb-1">🐘 Support</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p className="text-xs opacity-60 mt-1.5">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-medium transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-6 bg-gray-800/60 rounded-2xl border border-indigo-800/30 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: "How do I place a bet?", a: "Enter your bet amount and click 'Place Bet' during the waiting phase before each round." },
            { q: "Can I place multiple bets?", a: "Yes! You can place up to 2 bets simultaneously using both bet panels." },
            { q: "When should I cash out?", a: "Cash out anytime before the crash to secure your winnings. Higher multiplier = more risk!" },
            { q: "What happens if I don't cash out?", a: "If the elephant crashes before you cash out, you lose your bet amount." },
          ].map((faq, i) => (
            <div key={i} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
              <p className="text-indigo-400 font-medium text-sm mb-1">{faq.q}</p>
              <p className="text-gray-400 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
