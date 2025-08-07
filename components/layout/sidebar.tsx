'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Home,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPage, onPageChange, isOpen, onClose }: SidebarProps) {
  const { user, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
      page: 'dashboard',
      permission: 'view_own_data'
    },
    {
      name: 'Settings',
      icon: Settings,
      page: 'settings',
      permission: 'view_own_data'
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          'fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden',
          isOpen ? 'block' : 'hidden'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 h-screen md:h-[calc(100vh-5rem)]',
          'fixed top-0 left-0 z-40 md:relative',
          'transform transition-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 p-2"
        >
          <ChevronLeft className={cn(
            'h-4 w-4 transition-transform',
            collapsed && 'rotate-180'
          )} />
        </Button>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            if (!hasPermission(item.permission)) return null;
            
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            
            return (
              <Button
                key={item.page}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  collapsed && 'px-2',
                  isActive && 'bg-primary text-primary-foreground'
                )}
                onClick={() => onPageChange(item.page)}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{item.name}</span>}
              </Button>
            );
          })}
        </nav>
      </div>
      </div>
    </>
  );
}
