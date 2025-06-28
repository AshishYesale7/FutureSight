
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  Brain,
  Eye,
  Newspaper,
  Lightbulb,
  LogOut,
  Settings,
  UserCircle,
  Moon,
  Sun,
  Palette,
  Expand,
  Shrink,
  FileText,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/use-theme';
import { useState, useEffect } from 'react'; 
import CustomizeThemeModal from './CustomizeThemeModal';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import LegalModal from './LegalModal';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/career-goals', label: 'Career Goals', icon: Target },
  { href: '/skills', label: 'Skills', icon: Brain },
  { href: '/career-vision', label: 'Career Vision', icon: Eye },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/resources', label: 'Resources', icon: Lightbulb },
  { href: '/subscription', label: 'Subscription', icon: Crown },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // const stripeSrc = `https://climate.stripe.com/badge/qBqsdE?theme=${theme}&size=small&locale=en-IN`;

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <>
      <div className="hidden md:flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground fixed left-0 top-0 frosted-glass">
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-6">
          <Link href="/" className="text-center">
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
              <h1 className="font-headline text-2xl font-semibold text-white">FutureSight</h1>
            </div>
            <p className="text-xs text-sidebar-foreground/70 -mt-1">by H Stream</p>
          </Link>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                pathname === item.href
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          {/* <div className="p-4 pt-0">
              <a href="https://climate.stripe.com/EYRGZr" target="_blank" rel="noopener noreferrer" className="block mb-4 h-[38px]">
                <iframe
                  src={stripeSrc}
                  frameBorder="0"
                  scrolling="no"
                  style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                  title="Stripe Climate Badge"
                ></iframe>
              </a>
          </div>
          <div className="border-t border-sidebar-border -mx-4 mb-4" /> */}
          <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 mb-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || 'User'} />
                  <AvatarFallback>
                    {user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle size={20} />}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user?.displayName || user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 frosted-glass">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCustomizeModalOpen(true)}>
                <Palette className="mr-2 h-4 w-4" />
                <span>Customize Theme</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFullScreen}>
                {isFullScreen ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                <span>{isFullScreen ? 'Exit Fullscreen' : 'Go Fullscreen'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLegalModalOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Terms & Policies</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CustomizeThemeModal
        isOpen={isCustomizeModalOpen}
        onOpenChange={setIsCustomizeModalOpen}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
      <LegalModal
        isOpen={isLegalModalOpen}
        onOpenChange={setIsLegalModalOpen}
      />
    </>
  );
}
