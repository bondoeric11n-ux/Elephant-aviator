import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  balance: number;
  role: 'user' | 'admin';
  createdAt: string;
  isBanned: boolean;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => { success: boolean; message: string };
  register: (username: string, email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateBalance: (amount: number) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  updateAdminStatus: (userId: string, isAdmin: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Initialize with default admin if no users exist
    const storedUsers = localStorage.getItem('elephant_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const defaultAdmin: User = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@elephant.com',
        password: 'admin123',
        balance: 999999,
        role: 'admin',
        createdAt: new Date().toISOString(),
        isBanned: false,
      };
      setUsers([defaultAdmin]);
      localStorage.setItem('elephant_users', JSON.stringify([defaultAdmin]));
    }

    // Restore session
    const session = localStorage.getItem('elephant_session');
    if (session) {
      const sessionUser = JSON.parse(session);
      setUser(sessionUser);
    }
  }, []);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('elephant_users', JSON.stringify(newUsers));
  };

  const login = (email: string, password: string) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, message: 'Invalid email or password' };
    if (found.isBanned) return { success: false, message: 'Your account has been banned' };
    setUser(found);
    localStorage.setItem('elephant_session', JSON.stringify(found));
    return { success: true, message: 'Login successful' };
  };

  const register = (username: string, email: string, password: string) => {
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email already registered' };
    }
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Username already taken' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      password,
      balance: 1000,
      role: 'user',
      createdAt: new Date().toISOString(),
      isBanned: false,
    };
    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    setUser(newUser);
    localStorage.setItem('elephant_session', JSON.stringify(newUser));
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('elephant_session');
  };

  const updateBalance = (amount: number) => {
    if (!user) return;
    const updated = { ...user, balance: amount };
    setUser(updated);
    localStorage.setItem('elephant_session', JSON.stringify(updated));
    const newUsers = users.map(u => u.id === user.id ? updated : u);
    saveUsers(newUsers);
  };

  const banUser = (userId: string) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, isBanned: true } : u);
    saveUsers(newUsers);
  };

  const unbanUser = (userId: string) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, isBanned: false } : u);
    saveUsers(newUsers);
  };

  const updateAdminStatus = (userId: string, isAdmin: boolean) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, role: (isAdmin ? 'admin' : 'user') as 'admin' | 'user' } : u);
    saveUsers(newUsers);
  };

  return (
    <AuthContext.Provider value={{
      user, users, login, register, logout,
      updateBalance, banUser, unbanUser, updateAdminStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
