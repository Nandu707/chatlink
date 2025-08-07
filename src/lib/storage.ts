import { User, Message, Chat, Notification, InterestTag, ThemeMode } from '@/types';
import { generateId, getRandomAvatar } from './utils';

// Storage keys
const USERS_KEY = 'chatlink_users';
const CURRENT_USER_KEY = 'chatlink_current_user';
const CHATS_KEY = 'chatlink_chats';
const NOTIFICATIONS_KEY = 'chatlink_notifications';
const THEME_MODE_KEY = 'chatlink_theme_mode';

// Initialize storage with default values if empty
const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CHATS_KEY)) {
    localStorage.setItem(CHATS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(THEME_MODE_KEY)) {
    localStorage.setItem(THEME_MODE_KEY, JSON.stringify('light' as ThemeMode));
  }
};

// Initialize storage on import
initStorage();

// User-related functions
export const getAllUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const getUserById = (id: string): User | null => {
  const users = getAllUsers();
  return users.find(user => user.id === id) || null;
};

export const getUserByEmail = (email: string): User | null => {
  const users = getAllUsers();
  return users.find(user => user.email === email) || null;
};

export const getUserByUsername = (username: string): User | null => {
  const users = getAllUsers();
  return users.find(user => user.username === username) || null;
};

export const createUser = (userData: Omit<User, 'id' | 'friends' | 'friendRequests' | 'status' | 'createdAt'>): User => {
  const users = getAllUsers();
  const newUser: User = {
    id: generateId(),
    username: userData.username,
    email: userData.email,
    password: userData.password,
    profileImage: userData.profileImage || getRandomAvatar(userData.username),
    bio: userData.bio || '',
    interests: userData.interests || [],
    friends: [],
    friendRequests: { sent: [], received: [] },
    status: 'online',
    createdAt: new Date().toISOString(),
  };
  
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  return newUser;
};

export const updateUser = (updatedUser: User): User => {
  const users = getAllUsers();
  const updatedUsers = users.map(user => 
    user.id === updatedUser.id ? updatedUser : user
  );
  
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  
  // Update current user if this is the current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === updatedUser.id) {
    setCurrentUser(updatedUser);
  }
  
  return updatedUser;
};

export const deleteUser = (id: string): void => {
  const users = getAllUsers();
  const updatedUsers = users.filter(user => user.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  
  // Clear current user if this is the current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === id) {
    clearCurrentUser();
  }
};

// Current user functions
export const getCurrentUser = (): User | null => {
  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  return currentUser ? JSON.parse(currentUser) : null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Guest user function
export const createGuestUser = (userData: Partial<User>): User => {
  const guestId = generateId();
  const guestUser: User = {
    id: guestId,
    username: userData.username || `Guest_${Math.floor(Math.random() * 10000)}`,
    email: `guest_${guestId}@temp.chatlink`, // Temporary email for guest users
    password: generateId(), // Random password for security
    profileImage: userData.profileImage || getRandomAvatar(userData.username || 'Guest'),
    bio: userData.bio || 'I am a guest user',
    interests: userData.interests || [],
    friends: [],
    friendRequests: { sent: [], received: [] },
    status: 'online',
    createdAt: new Date().toISOString(),
    isGuest: true // Flag to identify guest users
  };
  
  const users = getAllUsers();
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, guestUser]));
  setCurrentUser(guestUser);
  
  return guestUser;
};

// Authentication functions
export const login = (email: string, password: string): User | null => {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    // Update user status to online
    const updatedUser = { ...user, status: 'online' as const };
    updateUser(updatedUser);
    setCurrentUser(updatedUser);
    return updatedUser;
  }
  return null;
};

export const register = (userData: Omit<User, 'id' | 'friends' | 'friendRequests' | 'status' | 'createdAt' | 'isGuest'>): User | null => {
  // Check if email or username already exists
  const existingUserByEmail = getUserByEmail(userData.email);
  const existingUserByUsername = getUserByUsername(userData.username);
  
  if (existingUserByEmail || existingUserByUsername) {
    return null;
  }
  
  const newUser = createUser({
    ...userData,
    isGuest: false // Ensure regular users are not marked as guests
  });
  setCurrentUser(newUser);
  return newUser;
};

export const logout = (): void => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    // Update user status to offline
    const updatedUser = { ...currentUser, status: 'offline' as const };
    updateUser(updatedUser);
    clearCurrentUser();
  }
};

// Friend-related functions
export const sendFriendRequest = (senderId: string, receiverId: string): boolean => {
  const sender = getUserById(senderId);
  const receiver = getUserById(receiverId);
  
  if (!sender || !receiver) return false;
  
  // Check if already friends or request already sent
  if (
    sender.friends.includes(receiverId) ||
    sender.friendRequests.sent.includes(receiverId) ||
    receiver.friendRequests.received.includes(senderId)
  ) {
    return false;
  }
  
  // Update sender
  const updatedSender = {
    ...sender,
    friendRequests: {
      ...sender.friendRequests,
      sent: [...sender.friendRequests.sent, receiverId],
    },
  };
  
  // Update receiver
  const updatedReceiver = {
    ...receiver,
    friendRequests: {
      ...receiver.friendRequests,
      received: [...receiver.friendRequests.received, senderId],
    },
  };
  
  updateUser(updatedSender);
  updateUser(updatedReceiver);
  
  // Create notification for receiver
  createNotification({
    userId: receiverId,
    type: 'friend_request',
    message: `${sender.username} sent you a friend request`,
    read: false,
    relatedUserId: senderId,
  });
  
  return true;
};

export const acceptFriendRequest = (userId: string, senderId: string): boolean => {
  const user = getUserById(userId);
  const sender = getUserById(senderId);
  
  if (!user || !sender) return false;
  
  // Check if request exists
  if (
    !user.friendRequests.received.includes(senderId) ||
    !sender.friendRequests.sent.includes(userId)
  ) {
    return false;
  }
  
  // Update user
  const updatedUser = {
    ...user,
    friends: [...user.friends, senderId],
    friendRequests: {
      ...user.friendRequests,
      received: user.friendRequests.received.filter(id => id !== senderId),
    },
  };
  
  // Update sender
  const updatedSender = {
    ...sender,
    friends: [...sender.friends, userId],
    friendRequests: {
      ...sender.friendRequests,
      sent: sender.friendRequests.sent.filter(id => id !== userId),
    },
  };
  
  updateUser(updatedUser);
  updateUser(updatedSender);
  
  // Create notification for sender
  createNotification({
    userId: senderId,
    type: 'system',
    message: `${user.username} accepted your friend request`,
    read: false,
    relatedUserId: userId,
  });
  
  return true;
};

export const rejectFriendRequest = (userId: string, senderId: string): boolean => {
  const user = getUserById(userId);
  const sender = getUserById(senderId);
  
  if (!user || !sender) return false;
  
  // Check if request exists
  if (
    !user.friendRequests.received.includes(senderId) ||
    !sender.friendRequests.sent.includes(userId)
  ) {
    return false;
  }
  
  // Update user
  const updatedUser = {
    ...user,
    friendRequests: {
      ...user.friendRequests,
      received: user.friendRequests.received.filter(id => id !== senderId),
    },
  };
  
  // Update sender
  const updatedSender = {
    ...sender,
    friendRequests: {
      ...sender.friendRequests,
      sent: sender.friendRequests.sent.filter(id => id !== userId),
    },
  };
  
  updateUser(updatedUser);
  updateUser(updatedSender);
  
  return true;
};

// Chat-related functions
export const getAllChats = (): Chat[] => {
  const chats = localStorage.getItem(CHATS_KEY);
  return chats ? JSON.parse(chats) : [];
};

export const getChatById = (id: string): Chat | null => {
  const chats = getAllChats();
  return chats.find(chat => chat.id === id) || null;
};

export const getUserChats = (userId: string): Chat[] => {
  const chats = getAllChats();
  return chats.filter(chat => chat.participants.includes(userId));
};

export const getChatBetweenUsers = (userIds: string[]): Chat | null => {
  const chats = getAllChats();
  return (
    chats.find(
      chat =>
        chat.participants.length === userIds.length &&
        userIds.every(id => chat.participants.includes(id))
    ) || null
  );
};

export const createChat = (participants: string[]): Chat => {
  const chats = getAllChats();
  const newChat: Chat = {
    id: generateId(),
    participants,
    messages: [],
  };
  
  localStorage.setItem(CHATS_KEY, JSON.stringify([...chats, newChat]));
  return newChat;
};

export const getOrCreateChat = (participants: string[]): Chat => {
  const existingChat = getChatBetweenUsers(participants);
  if (existingChat) {
    return existingChat;
  }
  
  return createChat(participants);
};

export const sendMessage = (
  chatId: string,
  senderId: string,
  content: string
): Message | null => {
  const chat = getChatById(chatId);
  
  if (!chat) return null;
  
  const message: Message = {
    id: generateId(),
    senderId,
    receiverId: chat.participants.find(id => id !== senderId) || '',
    content,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  const updatedChat: Chat = {
    ...chat,
    messages: [...chat.messages, message],
    lastMessage: message,
  };
  
  const chats = getAllChats();
  const updatedChats = chats.map(c => (c.id === chatId ? updatedChat : c));
  
  localStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
  
  // Create notification for recipient
  const receiverId = chat.participants.find(id => id !== senderId);
  if (receiverId) {
    const sender = getUserById(senderId);
    createNotification({
      userId: receiverId,
      type: 'message',
      message: `New message from ${sender?.username || 'Someone'}`,
      read: false,
      relatedUserId: senderId,
    });
  }
  
  return message;
};

export const markMessagesAsRead = (chatId: string, userId: string): void => {
  const chat = getChatById(chatId);
  
  if (!chat) return;
  
  const updatedMessages = chat.messages.map(message =>
    message.receiverId === userId && !message.read
      ? { ...message, read: true }
      : message
  );
  
  const updatedChat: Chat = {
    ...chat,
    messages: updatedMessages,
    lastMessage: updatedMessages[updatedMessages.length - 1] || chat.lastMessage,
  };
  
  const chats = getAllChats();
  const updatedChats = chats.map(c => (c.id === chatId ? updatedChat : c));
  
  localStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
};

// Notification functions
export const getAllNotifications = (): Notification[] => {
  const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
  return notifications ? JSON.parse(notifications) : [];
};

export const getUserNotifications = (userId: string): Notification[] => {
  const notifications = getAllNotifications();
  return notifications
    .filter(notification => notification.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createNotification = (
  data: Omit<Notification, 'id' | 'timestamp'>
): Notification => {
  const notifications = getAllNotifications();
  const newNotification: Notification = {
    id: generateId(),
    userId: data.userId,
    type: data.type,
    message: data.message,
    read: data.read,
    relatedUserId: data.relatedUserId,
    timestamp: new Date().toISOString(),
  };
  
  localStorage.setItem(
    NOTIFICATIONS_KEY,
    JSON.stringify([...notifications, newNotification])
  );
  
  return newNotification;
};

export const markNotificationAsRead = (id: string): void => {
  const notifications = getAllNotifications();
  const updatedNotifications = notifications.map(notification =>
    notification.id === id ? { ...notification, read: true } : notification
  );
  
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = getAllNotifications();
  const updatedNotifications = notifications.map(notification =>
    notification.userId === userId ? { ...notification, read: true } : notification
  );
  
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
};

export const deleteNotification = (id: string): void => {
  const notifications = getAllNotifications();
  const updatedNotifications = notifications.filter(
    notification => notification.id !== id
  );
  
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
};

// Theme mode functions
export const getThemeMode = (): ThemeMode => {
  const theme = localStorage.getItem(THEME_MODE_KEY);
  return theme ? JSON.parse(theme) : 'light';
};

export const setThemeMode = (mode: ThemeMode): void => {
  localStorage.setItem(THEME_MODE_KEY, JSON.stringify(mode));
};

// User matching based on interests
export const findUserMatches = (userId: string, limit: number = 10): User[] => {
  const currentUser = getUserById(userId);
  if (!currentUser) return [];
  
  const users = getAllUsers();
  
  // Filter out current user and already friends
  const potentialMatches = users.filter(
    user =>
      user.id !== userId &&
      !currentUser.friends.includes(user.id) &&
      !currentUser.friendRequests.sent.includes(user.id) &&
      !currentUser.friendRequests.received.includes(user.id)
  );
  
  // Calculate interest match score for each user
  const userScores = potentialMatches.map(user => {
    const matchingInterests = user.interests.filter(interest =>
      currentUser.interests.includes(interest)
    );
    
    return {
      user,
      score: matchingInterests.length,
    };
  });
  
  // Sort by score (highest first) and return users
  return userScores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.user);
};

// Random chat matching
export const findRandomMatch = (userId: string): User | null => {
  const currentUser = getUserById(userId);
  if (!currentUser) return null;
  
  const users = getAllUsers();
  
  // Filter out current user and already friends
  const potentialMatches = users.filter(
    user =>
      user.id !== userId &&
      !currentUser.friends.includes(user.id) &&
      !currentUser.friendRequests.sent.includes(user.id) &&
      !currentUser.friendRequests.received.includes(user.id)
  );
  
  if (potentialMatches.length === 0) return null;
  
  // Return random user from potential matches
  const randomIndex = Math.floor(Math.random() * potentialMatches.length);
  return potentialMatches[randomIndex];
};

// Mock data generation for testing
export const generateMockData = (count: number = 10) => {
  // Clear existing data
  localStorage.setItem(USERS_KEY, JSON.stringify([]));
  localStorage.setItem(CHATS_KEY, JSON.stringify([]));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  
  // Generate mock users
  const mockUsers: User[] = [];
  
  for (let i = 0; i < count; i++) {
    mockUsers.push({
      id: generateId(),
      username: `user${i}`,
      email: `user${i}@example.com`,
      password: 'password',
      profileImage: getRandomAvatar(`user${i}`),
      bio: `This is the bio for user${i}`,
      interests: Array.from(
        { length: Math.floor(Math.random() * 5) + 1 },
        () => ['Gaming', 'Music', 'Movies', 'Books', 'Sports', 'Technology', 'Travel'][Math.floor(Math.random() * 7)]
      ),
      friends: [],
      friendRequests: { sent: [], received: [] },
      status: Math.random() > 0.5 ? 'online' : 'offline',
      createdAt: new Date().toISOString(),
    });
  }
  
  // Save mock users
  localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
};