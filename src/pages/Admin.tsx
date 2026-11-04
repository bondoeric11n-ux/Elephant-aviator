import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface GameRecord {
  id: number;
  multiplier: number;
  timestamp: string;
  bets: Array<{
    userId: string;
    amount: number;
    cashedOut: boolean;
    cashOutAt: number;
  }>;
}

export default function Admin() {
  const { user, users, banUser, unbanUser, updateAdminStatus } = useAuth();
  const { rooms, sendMessage, deleteRoom } = useChat();
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'chat' | 'settings'>('users');
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('elephant_game_records') || '[]');
    setGameRecords(records);
  }, [refreshKey]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl text-red-400">⛔ Access Denied</p>
        <p className="text-gray-400 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const handleSendAdminMessage = (roomId: string) => {
    if (!chatInput.trim()) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    sendMessage(room.userId, room.userName, chatInput, user.id, user.username, 'admin');
    setChatInput('');
    setRefreshKey(k => k + 1);
  };

  const totalRevenue = gameRecords.reduce((sum, g) => {
    return sum + g.bets.reduce((betSum, b) => {
      const won = b.cashedOut ? b.amount * b.cashOutAt : 0;
      return betSum + (b.amount - won);
    }, 0);
  }, 0);

  const totalBets = gameRecords.reduce((sum, g) => sum + g.bets.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span>⚙️</span> Admin Dashboard
        </h2>
        <p className="text-gray-400 mt-1">Manage users, games, and support</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/60 rounded-xl border border-indigo-800/30 p-4">
          <p className="text-gray-400 text-xs">Total Users</p>
          <p className="text-2xl font-bold text-indigo-400">{users.length}</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-indigo-800/30 p-4">
          <p className="text-gray-400 text-xs">Games Played</p>
          <p className="text-2xl font-bold text-green-400">{gameRecords.length}</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-indigo-800/30 p-4">
          <p className="text-gray-400 text-xs">Total Bets</p>
          <p className="text-2xl font-bold text-yellow-400">{totalBets}</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-indigo-800/30 p-4">
          <p className="text-gray-400 text-xs">House Revenue</p>
          <p className="text-2xl font-bold text-purple-400">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
        {(['users', 'games', 'chat', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-indigo-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab === 'users' && '👥'}
            {tab === 'games' && '🎮'}
            {tab === 'chat' && '💬'}
            {tab === 'settings' && '⚙️'}
            {' '}{tab}
            {tab === 'chat' && rooms.filter(r => r.unreadCount > 0).length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {rooms.filter(r => r.unreadCount > 0).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Balance</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{u.role === 'admin' ? '👑' : '👤'}</span>
                        <span className="text-white font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-green-400 font-mono">${u.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-900/50 text-purple-400' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        u.isBanned ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                      }`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {u.id !== user.id && (
                          <>
                            <button
                              onClick={() => u.isBanned ? unbanUser(u.id) : banUser(u.id)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                u.isBanned
                                  ? 'bg-green-900/50 text-green-400 hover:bg-green-800/50'
                                  : 'bg-red-900/50 text-red-400 hover:bg-red-800/50'
                              }`}
                            >
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => updateAdminStatus(u.id, u.role !== 'admin')}
                              className="px-2 py-1 rounded text-xs font-medium bg-purple-900/50 text-purple-400 hover:bg-purple-800/50"
                            >
                              {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="space-y-4">
          <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 p-4">
            <h3 className="text-lg font-bold text-white mb-3">Recent Games</h3>
            {gameRecords.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No games played yet</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {gameRecords.slice(0, 50).map((game) => (
                  <div key={game.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${
                        game.multiplier < 2 ? 'text-red-400' :
                        game.multiplier < 5 ? 'text-green-400' : 'text-purple-400'
                      }`}>
                        {game.multiplier.toFixed(2)}x
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(game.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {game.bets.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {game.bets.map((bet, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-gray-800/50 rounded-lg px-3 py-1.5">
                            <span className="text-gray-300">
                              ${bet.amount.toFixed(2)} bet
                            </span>
                            <span className={bet.cashedOut ? 'text-green-400' : 'text-red-400'}>
                              {bet.cashedOut
                                ? `Won $${(bet.amount * bet.cashOutAt).toFixed(2)} @ ${bet.cashOutAt.toFixed(2)}x`
                                : 'Lost'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Room List */}
          <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Support Chats</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {rooms.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-sm">No chats yet</p>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedChatRoom(room.id);
                      setRefreshKey(k => k + 1);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                      selectedChatRoom === room.id ? 'bg-indigo-900/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">{room.userName}</span>
                      {room.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1 truncate">{room.lastMessage}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(room.lastMessageTime).toLocaleTimeString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-gray-800/60 rounded-2xl border border-indigo-800/30 flex flex-col h-[550px]">
            {selectedChatRoom ? (
              <>
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-white font-bold">
                    Chat with {rooms.find(r => r.id === selectedChatRoom)?.userName}
                  </h3>
                  <button
                    onClick={() => {
                      deleteRoom(selectedChatRoom);
                      setSelectedChatRoom(null);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {rooms.find(r => r.id === selectedChatRoom)?.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                        msg.senderRole === 'admin'
                          ? 'bg-indigo-700 text-white'
                          : 'bg-gray-700 text-gray-200'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAdminMessage(selectedChatRoom)}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Type a message..."
                    />
                    <button
                      onClick={() => handleSendAdminMessage(selectedChatRoom)}
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>Select a chat to start replying</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Platform Settings</h3>
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
              <h4 className="text-white font-medium mb-2">House Edge</h4>
              <p className="text-gray-400 text-sm">Current crash probability: ~3% instant crash, exponential growth curve</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
              <h4 className="text-white font-medium mb-2">New User Balance</h4>
              <p className="text-gray-400 text-sm">$1,000 virtual credits for all new registrations</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
              <h4 className="text-white font-medium mb-2">Game Speed</h4>
              <p className="text-gray-400 text-sm">Multiplier growth: e^(0.07t) — approximately 2x every 10 seconds</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
              <h4 className="text-white font-medium mb-2">Data Management</h4>
              <button
                onClick={() => {
                  if (confirm('Clear all game records?')) {
                    localStorage.removeItem('elephant_game_records');
                    setGameRecords([]);
                  }
                }}
                className="mt-2 px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded-lg text-sm font-medium border border-red-800/50 transition-colors"
              >
                Clear Game Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
