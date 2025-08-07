'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Search,
  MoreHorizontal,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  FileAudio,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

// Mock user data
const mockUsers = [
  {
    id: '1',
    email: 'admin@callsense.com',
    role: 'super_admin',
    company: 'CallSense Inc.',
    isActive: true,
    quotaLimit: 10000,
    quotaUsed: 245,
    totalCalls: 89,
    lastLogin: '2024-01-20T10:30:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    status: 'active'
  },
  {
    id: '2',
    email: 'manager@techcorp.com',
    role: 'admin',
    company: 'Tech Corp',
    isActive: true,
    quotaLimit: 1000,
    quotaUsed: 234,
    totalCalls: 45,
    lastLogin: '2024-01-20T09:15:00Z',
    createdAt: '2024-01-16T00:00:00Z',
    status: 'active'
  },
  {
    id: '3',
    email: 'john.doe@techcorp.com',
    role: 'user',
    company: 'Tech Corp',
    isActive: true,
    quotaLimit: 100,
    quotaUsed: 67,
    totalCalls: 23,
    lastLogin: '2024-01-20T11:45:00Z',
    createdAt: '2024-01-17T00:00:00Z',
    status: 'active'
  },
  {
    id: '4',
    email: 'sarah.wilson@startup.io',
    role: 'user',
    company: 'Startup Inc',
    isActive: false,
    quotaLimit: 100,
    quotaUsed: 12,
    totalCalls: 5,
    lastLogin: '2024-01-18T14:20:00Z',
    createdAt: '2024-01-18T00:00:00Z',
    status: 'suspended'
  },
  {
    id: '5',
    email: 'mike.johnson@enterprise.com',
    role: 'admin',
    company: 'Enterprise Solutions',
    isActive: true,
    quotaLimit: 2000,
    quotaUsed: 1876,
    totalCalls: 156,
    lastLogin: '2024-01-20T08:00:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    status: 'active'
  }
];

export function UserManagement() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  if (!hasPermission('view_all_data')) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access user management.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getQuotaPercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const handleUserAction = (action: string, userId: string) => {
    switch (action) {
      case 'view':
        toast.info(`Viewing details for user ${userId}`);
        break;
      case 'edit':
        toast.info(`Editing user ${userId}`);
        break;
      case 'suspend':
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isActive: false, status: 'suspended' } : u
        ));
        toast.success('User suspended successfully');
        break;
      case 'activate':
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isActive: true, status: 'active' } : u
        ));
        toast.success('User activated successfully');
        break;
      case 'delete':
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('User deleted successfully');
        break;
      default:
        break;
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.adminUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by email or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quota Usage</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-gray-600">{user.company}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {user.quotaUsed} / {user.quotaLimit}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getQuotaPercentage(user.quotaUsed, user.quotaLimit)}% used
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <FileAudio className="h-4 w-4 text-gray-400" />
                        <span>{user.totalCalls}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(user.lastLogin)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUserAction('view', user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction('edit', user.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isActive ? (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction('suspend', user.id)}
                              className="text-orange-600"
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction('activate', user.id)}
                              className="text-green-600"
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUserAction('delete', user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}