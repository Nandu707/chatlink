export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage: string;
  bio: string;
  interests: string[];
  friends: string[];
  friendRequests: {
    sent: string[];
    received: string[];
  };
  status: 'online' | 'offline' | 'away';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
}

export interface InterestTag {
  id: string;
  name: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'message' | 'system';
  message: string;
  read: boolean;
  relatedUserId?: string;
  timestamp: string;
}