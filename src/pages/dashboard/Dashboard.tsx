import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { findUserMatches, findRandomMatch, getUserById } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Shuffle, UserPlus } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [randomMatchUser, setRandomMatchUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRandomMatchLoading, setIsRandomMatchLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load recommended matches
    const matches = findUserMatches(user.id, 5);
    setMatchedUsers(matches);
  }, [user]);

  const handleRandomMatch = () => {
    if (!user) return;
    
    setIsRandomMatchLoading(true);
    const match = findRandomMatch(user.id);
    setRandomMatchUser(match);
    setIsRandomMatchLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
          <Button 
            onClick={handleRandomMatch} 
            disabled={isRandomMatchLoading}
            className="flex items-center gap-2"
          >
            {isRandomMatchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            Random Chat
          </Button>
        </div>

        {randomMatchUser && (
          <Card className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                Random Match
              </CardTitle>
              <CardDescription>
                You've been matched with someone based on your interests!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={randomMatchUser.profileImage} alt={randomMatchUser.username} />
                <AvatarFallback>{getInitials(randomMatchUser.username)}</AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="text-lg font-semibold">{randomMatchUser.username}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{randomMatchUser.bio || 'No bio available'}</p>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {randomMatchUser.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link to={`/profile/${randomMatchUser.id}`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/messages?userId=${randomMatchUser.id}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chat
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Recommended Connections</h2>
          
          {matchedUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedUsers.map((matchedUser) => (
                <Card key={matchedUser.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={matchedUser.profileImage} alt={matchedUser.username} />
                        <AvatarFallback>{getInitials(matchedUser.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{matchedUser.username}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {matchedUser.bio || 'No bio available'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {matchedUser.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${matchedUser.id}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/messages?userId=${matchedUser.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start Chat
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No recommendations available. Try adding interests to your profile!
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/profile">Update Profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}