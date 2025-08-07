import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { predefinedInterests, getRandomAvatar } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
  });
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const generateNewAvatar = () => {
    const newAvatar = getRandomAvatar();
    setFormData({ ...formData, profileImage: newAvatar });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateProfile({
        ...user!,
        username: formData.username,
        bio: formData.bio,
        profileImage: formData.profileImage,
        interests: selectedInterests,
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile information and how others see you
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={formData.profileImage} alt={user.username} />
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                
                <Button type="button" variant="outline" size="sm" onClick={generateNewAvatar}>
                  Generate New Avatar
                </Button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Interests</Label>
              <p className="text-sm text-muted-foreground">
                Select interests to help match with others who share similar interests
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {predefinedInterests.map((interest) => (
                  <Badge
                    key={interest.id}
                    variant={selectedInterests.includes(interest.name) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleInterestToggle(interest.name)}
                  >
                    {selectedInterests.includes(interest.name) && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {interest.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}