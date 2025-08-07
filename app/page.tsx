'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { FileUpload } from '@/components/upload/file-upload';
import { UserManagement } from '@/components/admin/user-management';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export default function Home() {
  const { user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <LoginForm onToggleMode={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onToggleMode={() => setIsLogin(true)} />
    );
  }

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'upload':
        return 'Upload Calls';
      case 'history':
        return 'Call History';
      case 'analytics':
        return 'Analytics';
      case 'users':
        return 'User Management';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview onNavigate={setCurrentPage} />;
      case 'upload':
        return <FileUpload />;
      case 'history':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Call History</h2>
            <p className="text-gray-600">Feature coming soon...</p>
          </div>
        );
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600">Feature coming soon...</p>
          </div>
        );
      default:
        return <DashboardOverview onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={getPageTitle(currentPage)}
        onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}