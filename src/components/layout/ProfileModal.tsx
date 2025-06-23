'use client';

import type { FC } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { Edit, Github, Linkedin, Twitter } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const { backgroundImage } = useTheme();

  // Mock data for stats - in a real app, this would come from user data
  const stats = {
    goals: 3,
    skills: 4,
    resources: 5,
  };

  const bio = "Aspiring software engineer with a passion for building innovative AI-driven applications. Currently focused on mastering data structures and preparing for a future in tech leadership.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass p-0 border-0 overflow-hidden">
        {/* ADDED FOR ACCESSIBILITY */}
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            This modal contains your profile information, stats, and social links.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 w-full relative">
             <Image
                src={backgroundImage || "https://images.unsplash.com/photo-1554147090-e1221a04a0625?q=80&w=2070&auto=format&fit=crop"}
                alt="Cover"
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
                data-ai-hint="abstract background"
              />
          </div>
         
          <div className="p-6 pt-0">
             {/* Avatar and Edit button */}
            <div className="flex justify-between items-end -mt-12">
                 <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-3xl">
                        {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="mb-2" disabled>
                    <Edit className="mr-2 h-4 w-4"/> Edit Profile
                </Button>
            </div>

             {/* User Info */}
            <div className="mt-4">
                <h2 className="text-2xl font-bold text-primary">{user?.displayName || "Anonymous User"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            {/* Bio */}
            <div className="mt-6">
                <h3 className="font-semibold text-foreground">About</h3>
                <p className="text-sm text-foreground/80 mt-1">{bio}</p>
            </div>

             {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xl font-bold text-accent">{stats.goals}</p>
                    <p className="text-xs text-muted-foreground">Goals</p>
                </div>
                 <div>
                    <p className="text-xl font-bold text-accent">{stats.skills}</p>
                    <p className="text-xs text-muted-foreground">Skills</p>
                </div>
                 <div>
                    <p className="text-xl font-bold text-accent">{stats.resources}</p>
                    <p className="text-xs text-muted-foreground">Resources</p>
                </div>
            </div>

            {/* Social Links */}
             <div className="mt-6">
                <h3 className="font-semibold text-foreground mb-2">Connect</h3>
                <div className="flex space-x-3">
                     <Button variant="outline" size="icon" asChild>
                         <a href="#" target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5"/></a>
                     </Button>
                     <Button variant="outline" size="icon" asChild>
                         <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5"/></a>
                     </Button>
                      <Button variant="outline" size="icon" asChild>
                         <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5"/></a>
                     </Button>
                </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
