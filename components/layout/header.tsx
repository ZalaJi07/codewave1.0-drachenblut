'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Headphones, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="hidden items-center space-x-2 md:flex">
            <Headphones className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">CallSense</h1>
          </div>
          {/* Removed the separator and title display */}
        </div>

        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-sm font-medium">{user.company}</div>
              <div className="text-xs text-gray-500">{user.name || user.email.split('@')[0]}</div>
            </div>
          </div>

          {/* Logout Button - Icon Only */}
          <Button 
            onClick={logout} 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
