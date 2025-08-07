import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserChats, getUserById } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LayoutGrid, MessageSquare, Users, UserPlus } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function Sidebar() {
  const { user } = useAuth();
  const [activeChats, setActiveChats] = useState<{ id: string; userId: string; username: string; profileImage: string }[]>([]);
  const location = useLocation();

  useEffect(() => {
    const loadChats = () => {
      if (!user) return;

      const userChats = getUserChats(user.id);
      
      const processedChats = userChats.map(chat => {
        // Get the other user in the chat
        const otherUserId = chat.participants.find(id => id !== user.id);
        if (!otherUserId) return null;
        
        const otherUser = getUserById(otherUserId);
        if (!otherUser) return null;
        
        return {
          id: chat.id,
          userId: otherUser.id,
          username: otherUser.username,
          profileImage: otherUser.profileImage,
        };
      }).filter(Boolean);
      
      // @ts-expect-error - We've filtered out null values
      setActiveChats(processedChats);
    };

    loadChats();
    
    // Refresh chats periodically
    const intervalId = setInterval(loadChats, 5000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  if (!user) return null;

  const navLinkClasses = (isActive: boolean) => 
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
      isActive 
        ? 'bg-accent text-accent-foreground' 
        : 'hover:bg-accent/50'
    }`;

  return (
    <div className="w-64 border-r h-[calc(100vh-3.5rem)] p-4 flex flex-col">
      <div className="space-y-1">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => navLinkClasses(isActive)}
        >
          <LayoutGrid size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/discover" 
          className={({ isActive }) => navLinkClasses(isActive)}
        >
          <UserPlus size={20} />
          <span>Discover</span>
        </NavLink>
        
        <NavLink 
          to="/friends" 
          className={({ isActive }) => navLinkClasses(isActive)}
        >
          <Users size={20} />
          <span>Friends</span>
        </NavLink>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Recent Messages</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            asChild
          >
            <NavLink to="/messages">
              <MessageSquare size={16} />
            </NavLink>
          </Button>
        </div>

        <div className="space-y-1">
          {activeChats.length > 0 ? (
            activeChats.map((chat) => (
              <NavLink
                key={chat.id}
                to={`/messages/${chat.id}`}
                className={({ isActive }) => `${navLinkClasses(isActive)} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={chat.profileImage} alt={chat.username} />
                    <AvatarFallback>{getInitials(chat.username)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{chat.username}</span>
                </div>
              </NavLink>
            ))
          ) : (
            <p className="text-sm text-muted-foreground px-3 py-2">
              No recent messages
            </p>
          )}
          
          {activeChats.length > 0 && (
            <NavLink
              to="/messages"
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              <div className="w-full text-center text-sm text-muted-foreground">
                View all
              </div>
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
}