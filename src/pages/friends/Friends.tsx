import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { 
  getUserById, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest 
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, MessageSquare, UserPlus, X } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export default function Friends() {
  const { user, updateProfile } = useAuth();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<User[]>([]);
  
  useEffect(() => {
    if (!user) return;

    const loadFriendsData = () => {
      // Load friends
      const friendsList = user.friends
        .map(friendId => getUserById(friendId))
        .filter(Boolean) as User[];
      
      setFriends(friendsList);

      // Load received friend requests
      const receivedList = user.friendRequests.received
        .map(senderId => getUserById(senderId))
        .filter(Boolean) as User[];
      
      setReceivedRequests(receivedList);

      // Load sent friend requests
      const sentList = user.friendRequests.sent
        .map(receiverId => getUserById(receiverId))
        .filter(Boolean) as User[];
      
      setSentRequests(sentList);
    };

    loadFriendsData();
    
    // Refresh periodically
    const intervalId = setInterval(loadFriendsData, 5000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  const handleAcceptRequest = (senderId: string) => {
    if (!user) return;
    
    const success = acceptFriendRequest(user.id, senderId);
    
    if (success) {
      // Refresh current user data to get updated friends list
      const updatedUser = getUserById(user.id);
      if (updatedUser) {
        updateProfile(updatedUser);
      }
      
      toast.success('Friend request accepted');
    } else {
      toast.error('Failed to accept friend request');
    }
  };

  const handleRejectRequest = (senderId: string) => {
    if (!user) return;
    
    const success = rejectFriendRequest(user.id, senderId);
    
    if (success) {
      // Refresh current user data to get updated friends list
      const updatedUser = getUserById(user.id);
      if (updatedUser) {
        updateProfile(updatedUser);
      }
      
      toast.success('Friend request rejected');
    } else {
      toast.error('Failed to reject friend request');
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      
      <Tabs defaultValue="friends">
        <TabsList className="mb-6">
          <TabsTrigger value="friends">
            Friends {friends.length > 0 && `(${friends.length})`}
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests {receivedRequests.length > 0 && `(${receivedRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <Card key={friend.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.profileImage} alt={friend.username} />
                        <AvatarFallback>{getInitials(friend.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{friend.username}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center text-xs">
                            <span className={`w-2 h-2 rounded-full mr-1 ${
                              friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span>
                            <span>{friend.status}</span>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-2">
                      {friend.bio || 'No bio available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {friend.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                      {friend.interests.length > 3 && (
                        <Badge variant="outline">
                          +{friend.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link to={`/profile/${friend.id}`}>View Profile</Link>
                    </Button>
                    <Button asChild>
                      <Link to={`/messages?userId=${friend.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    You don't have any friends yet
                  </p>
                  <Button asChild>
                    <Link to="/discover">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Discover People
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="requests">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receivedRequests.length > 0 ? (
              receivedRequests.map((requester) => (
                <Card key={requester.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={requester.profileImage} alt={requester.username} />
                        <AvatarFallback>{getInitials(requester.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{requester.username}</CardTitle>
                        <CardDescription>
                          Sent you a friend request
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-2">
                      {requester.bio || 'No bio available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {requester.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                      {requester.interests.length > 3 && (
                        <Badge variant="outline">
                          +{requester.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectRequest(requester.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleAcceptRequest(requester.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No pending friend requests
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sentRequests.length > 0 ? (
              sentRequests.map((receiver) => (
                <Card key={receiver.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={receiver.profileImage} alt={receiver.username} />
                        <AvatarFallback>{getInitials(receiver.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{receiver.username}</CardTitle>
                        <CardDescription>
                          Request pending
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-2">
                      {receiver.bio || 'No bio available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {receiver.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                      {receiver.interests.length > 3 && (
                        <Badge variant="outline">
                          +{receiver.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    You haven't sent any friend requests
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}