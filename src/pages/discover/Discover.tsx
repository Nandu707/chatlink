import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { getAllUsers, sendFriendRequest } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, UserPlus } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { predefinedInterests } from '@/lib/utils';

export default function Discover() {
  const { user } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    // Get all users except current user, friends, and users with pending requests
    const allUsers = getAllUsers();
    const availableUsers = allUsers.filter((u) => {
      if (u.id === user.id) return false; // Exclude current user
      if (user.friends.includes(u.id)) return false; // Exclude friends
      if (user.friendRequests.sent.includes(u.id)) return false; // Exclude sent requests
      if (user.friendRequests.received.includes(u.id)) return false; // Exclude received requests
      return true;
    });
    
    setUsers(availableUsers);
    setFilteredUsers(availableUsers);
  }, [user]);

  useEffect(() => {
    if (!users.length) return;
    
    // Apply filters
    let result = [...users];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((user) =>
        user.username.toLowerCase().includes(term) || 
        user.bio.toLowerCase().includes(term)
      );
    }
    
    // Filter by selected interests
    if (selectedInterests.length > 0) {
      result = result.filter((user) => 
        selectedInterests.some(interest => user.interests.includes(interest))
      );
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, selectedInterests]);

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSendFriendRequest = (receiverId: string) => {
    if (!user) return;
    
    const success = sendFriendRequest(user.id, receiverId);
    
    if (success) {
      // Update the users list to exclude this user
      setUsers(users.filter(u => u.id !== receiverId));
      setFilteredUsers(filteredUsers.filter(u => u.id !== receiverId));
      
      toast.success('Friend request sent');
    } else {
      toast.error('Failed to send friend request');
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Discover People</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by username or bio"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex-1">
          <Card>
            <CardContent className="py-3">
              <div className="flex flex-wrap gap-2">
                {predefinedInterests.map((interest) => (
                  <Badge
                    key={interest.id}
                    variant={selectedInterests.includes(interest.name) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleInterestToggle(interest.name)}
                  >
                    {interest.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((discoverUser) => (
            <Card key={discoverUser.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={discoverUser.profileImage} alt={discoverUser.username} />
                    <AvatarFallback>{getInitials(discoverUser.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{discoverUser.username}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center text-xs">
                        <span className={`w-2 h-2 rounded-full mr-1 ${
                          discoverUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        <span>{discoverUser.status}</span>
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm line-clamp-2 mb-2">
                  {discoverUser.bio || 'No bio available'}
                </p>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {discoverUser.interests.slice(0, 3).map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                  {discoverUser.interests.length > 3 && (
                    <Badge variant="outline">
                      +{discoverUser.interests.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  asChild
                >
                  <Link to={`/messages?userId=${discoverUser.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Link>
                </Button>
                <Button 
                  onClick={() => handleSendFriendRequest(discoverUser.id)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Friend
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No users found matching your criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}