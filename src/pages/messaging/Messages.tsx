import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { getUserById, getOrCreateChat, sendMessage, markMessagesAsRead, getUserChats } from '@/lib/storage';
import { formatTime, getInitials } from '@/lib/utils';
import { Chat, User } from '@/types';

export default function Messages() {
  const { user } = useAuth();
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Parse userId from query params if it exists
  const queryParams = new URLSearchParams(location.search);
  const queryUserId = queryParams.get('userId');

  useEffect(() => {
    if (!user) return;

    // Load user chats
    const loadChats = () => {
      const userChats = getUserChats(user.id);
      setChats(userChats);
      
      // If chatId is provided, set active chat
      if (chatId) {
        const foundChat = userChats.find(c => c.id === chatId);
        if (foundChat) {
          setActiveChat(foundChat);
          
          // Find the other user in the chat
          const otherUserId = foundChat.participants.find(id => id !== user.id);
          if (otherUserId) {
            const otherUserData = getUserById(otherUserId);
            setOtherUser(otherUserData);
          }
          
          // Mark messages as read
          markMessagesAsRead(foundChat.id, user.id);
        } else {
          // Chat not found, redirect to messages page
          navigate('/messages');
        }
      } else if (queryUserId) {
        // If userId is provided in query params, find or create chat with that user
        const otherUserData = getUserById(queryUserId);
        if (otherUserData) {
          setOtherUser(otherUserData);
          
          // Find or create chat
          const chat = getOrCreateChat([user.id, otherUserData.id]);
          setActiveChat(chat);
          
          // Update URL to include chatId
          navigate(`/messages/${chat.id}`);
          
          // Mark messages as read
          markMessagesAsRead(chat.id, user.id);
        }
      }
    };
    
    loadChats();
    
    // Refresh chats and messages periodically
    const intervalId = setInterval(() => {
      loadChats();
      
      // Mark messages as read if there's an active chat
      if (activeChat) {
        markMessagesAsRead(activeChat.id, user.id);
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [user, chatId, queryUserId, navigate]);

  const handleSendMessage = () => {
    if (!user || !activeChat || !message.trim()) return;
    
    setIsLoading(true);
    sendMessage(activeChat.id, user.id, message.trim());
    setMessage('');
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChatSelect = (chat: Chat) => {
    // Find the other user in the chat
    const otherUserId = chat.participants.find(id => id !== user?.id);
    if (otherUserId) {
      const otherUserData = getUserById(otherUserId);
      setOtherUser(otherUserData);
    }
    
    setActiveChat(chat);
    navigate(`/messages/${chat.id}`);
    
    // Mark messages as read
    if (user) {
      markMessagesAsRead(chat.id, user.id);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-5rem)]">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-12 h-full gap-6">
        {/* Chat list */}
        <div className="col-span-4 border rounded-lg overflow-hidden">
          <div className="p-4 border-b font-medium">Recent Conversations</div>
          
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
            {chats.length > 0 ? (
              chats.map((chat) => {
                const chatOtherUserId = chat.participants.find(id => id !== user.id);
                const chatOtherUser = chatOtherUserId ? getUserById(chatOtherUserId) : null;
                
                if (!chatOtherUser) return null;
                
                const unreadCount = chat.messages.filter(
                  m => !m.read && m.receiverId === user.id
                ).length;
                
                const isActive = activeChat?.id === chat.id;
                
                return (
                  <div
                    key={chat.id}
                    className={`p-4 border-b cursor-pointer ${
                      isActive ? 'bg-accent' : unreadCount > 0 ? 'bg-accent/30' : ''
                    } hover:bg-accent transition-colors`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={chatOtherUser.profileImage} alt={chatOtherUser.username} />
                        <AvatarFallback>{getInitials(chatOtherUser.username)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{chatOtherUser.username}</h3>
                          {unreadCount > 0 && (
                            <div className="rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center text-xs">
                              {unreadCount}
                            </div>
                          )}
                        </div>
                        
                        {chat.lastMessage && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.lastMessage.senderId === user.id ? 'You: ' : ''}
                              {chat.lastMessage.content}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start chatting by discovering new friends</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="col-span-8 border rounded-lg flex flex-col">
          {activeChat && otherUser ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={otherUser.profileImage} alt={otherUser.username} />
                  <AvatarFallback>{getInitials(otherUser.username)}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-medium">{otherUser.username}</h3>
                  <div className="flex items-center text-xs">
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    <span className="text-muted-foreground">{otherUser.status}</span>
                  </div>
                </div>
              </div>
              
              {/* Message area */}
              <div 
                className="flex-1 overflow-y-auto p-4"
                style={{ maxHeight: 'calc(100vh - 20rem)' }}
              >
                {activeChat.messages.length > 0 ? (
                  <div className="space-y-4">
                    {activeChat.messages.map((msg) => {
                      const isCurrentUser = msg.senderId === user.id;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            {!isCurrentUser && (
                              <div className="mb-1 flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={otherUser.profileImage} alt={otherUser.username} />
                                  <AvatarFallback>{getInitials(otherUser.username)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{otherUser.username}</span>
                              </div>
                            )}
                            
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isCurrentUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p>{msg.content}</p>
                            </div>
                            
                            <div className={`mt-1 text-xs text-muted-foreground flex items-center ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}>
                              {formatTime(msg.timestamp)}
                              {isCurrentUser && (
                                <span className="ml-1">{msg.read ? 'Read' : 'Sent'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                    <div>
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation by sending a message</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="resize-none min-h-[60px]"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!message.trim() || isLoading} 
                    size="icon"
                    className="h-[60px]"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <div>
                <h3 className="text-lg font-medium">No active conversation</h3>
                <p className="text-sm mt-1">Select a chat or start a new conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}