import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { calculateTimeAgo } from '@/lib/utils';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = (id: string, type: string, relatedUserId?: string) => {
    markAsRead(id);
    
    if (type === 'friend_request' && relatedUserId) {
      navigate('/friends');
    } else if (type === 'message' && relatedUserId) {
      navigate(`/messages`);
    }
    
    onClose();
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <div className="py-1">
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 cursor-pointer hover:bg-accent ${
                  !notification.read ? 'bg-accent/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id, notification.type, notification.relatedUserId)}
              >
                <div className="flex justify-between">
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {calculateTimeAgo(notification.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}