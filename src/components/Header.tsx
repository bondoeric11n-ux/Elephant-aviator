import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { getTotalUnread } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unread = getTotalUnread();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-indigo-800/50 bg-gray-900/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-3xl">🐘</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Elephant Aviator
          </h1>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <div className="bg-gray-800 rounded-xl px-4 py-2 border border-indigo-700/50 mr-2">
              <span className="text-gray-400 text-xs block">Balance</span>
              <p className="text-green-400 font-bold">${user.balance.toFixed(2)}</p>
            </div>

            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              🎮 Game
            </Link>

            <Link
              to="/support"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive('/support') ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              💬 Support
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </Link>

            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin') ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                ⚙️ Admin
              </Link>
            )}

            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
              <span className="text-sm text-gray-400">
                {user.role === 'admin' ? '👑' : '👤'} {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-800/50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
