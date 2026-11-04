import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  userId: string;
  userName: string;
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatContextType {
  rooms: ChatRoom[];
  sendMessage: (userId: string, userName: string, message: string, senderId: string, senderName: string, senderRole: 'user' | 'admin') => void;
  markAsRead: (roomId: string) => void;
  getRoomForUser: (userId: string) => ChatRoom | undefined;
  getTotalUnread: () => number;
  deleteRoom: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('elephant_chats');
    if (stored) {
      setRooms(JSON.parse(stored));
    }
  }, []);

  const saveRooms = (newRooms: ChatRoom[]) => {
    setRooms(newRooms);
    localStorage.setItem('elephant_chats', JSON.stringify(newRooms));
  };

  const sendMessage = (
    userId: string,
    userName: string,
    message: string,
    senderId: string,
    senderName: string,
    senderRole: 'user' | 'admin'
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId,
      senderName,
      senderRole,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const existingRoom = rooms.find(r => r.userId === userId);
    if (existingRoom) {
      const updatedRooms = rooms.map(r => {
        if (r.userId === userId) {
          return {
            ...r,
            messages: [...r.messages, newMsg],
            lastMessage: message,
            lastMessageTime: newMsg.timestamp,
            unreadCount: senderRole === 'user' ? 0 : r.unreadCount + 1,
          };
        }
        return r;
      });
      saveRooms(updatedRooms);
    } else {
      const newRoom: ChatRoom = {
        id: `room-${Date.now()}`,
        userId,
        userName,
        messages: [newMsg],
        lastMessage: message,
        lastMessageTime: newMsg.timestamp,
        unreadCount: senderRole === 'admin' ? 1 : 0,
      };
      saveRooms([...rooms, newRoom]);
    }
  };

  const markAsRead = (roomId: string) => {
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          unreadCount: 0,
          messages: r.messages.map(m => ({ ...m, read: true })),
        };
      }
      return r;
    });
    saveRooms(updatedRooms);
  };

  const getRoomForUser = (userId: string) => {
    return rooms.find(r => r.userId === userId);
  };

  const getTotalUnread = () => {
    return rooms.reduce((sum, r) => sum + r.unreadCount, 0);
  };

  const deleteRoom = (roomId: string) => {
    saveRooms(rooms.filter(r => r.id !== roomId));
  };

  return (
    <ChatContext.Provider value={{
      rooms, sendMessage, markAsRead, getRoomForUser, getTotalUnread, deleteRoom
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
