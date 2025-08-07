import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, Users } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Hero section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-between p-6 md:p-12 bg-gradient-to-br from-background to-muted">
        <div className="w-full md:w-1/2 space-y-6 animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Connect with people from around the world
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md">
            ChatLink is a platform where strangers can connect, chat, and become friends based on shared interests.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Get Started
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">
                    Login
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/2 flex justify-center mt-12 md:mt-0">
          <div className="relative w-full max-w-md aspect-square">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[40%] left-[40%] w-1/5 h-1/5 bg-primary rounded-full"></div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-12 px-6 md:px-12 bg-muted/50">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ChatLink?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Interest-Based Matching</h3>
            <p className="text-muted-foreground">
              Connect with people who share your interests and passions
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Real-Time Messaging</h3>
            <p className="text-muted-foreground">
              Chat instantly with new friends with our easy-to-use messaging system
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Friend Management</h3>
            <p className="text-muted-foreground">
              Build your social network with our simple friend request system
            </p>
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="py-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to start chatting?</h2>
          <p className="text-muted-foreground mb-8">
            Join ChatLink today and start connecting with people from around the world
          </p>
          
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <Button size="lg" asChild>
              <Link to="/register">
                Create an Account
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
