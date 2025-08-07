'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Download,
  Calendar,
  Users,
  FileAudio,
  Target,
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalCalls: 1247,
    totalProblems: 89,
    avgProcessingTime: 3.2,
    accuracyRate: 94.7
  },
  topProblems: [
    { name: 'Payment Processing Issues', frequency: 234, trend: '+15%', severity: 'high', category: 'Billing' },
    { name: 'Login Authentication Failures', frequency: 189, trend: '+8%', severity: 'high', category: 'Authentication' },
    { name: 'UI/UX Confusion', frequency: 156, trend: '-2%', severity: 'medium', category: 'User Experience' },
    { name: 'Data Sync Problems', frequency: 134, trend: '+12%', severity: 'high', category: 'Technical' },
    { name: 'Feature Request - Export', frequency: 98, trend: '+25%', severity: 'low', category: 'Feature Request' },
    { name: 'Mobile App Crashes', frequency: 87, trend: '+18%', severity: 'medium', category: 'Technical' },
    { name: 'Subscription Billing', frequency: 76, trend: '+5%', severity: 'medium', category: 'Billing' },
    { name: 'Account Security Concerns', frequency: 65, trend: '+22%', severity: 'high', category: 'Security' }
  ],
  categoryBreakdown: [
    { category: 'Technical', count: 456, percentage: 36.6 },
    { category: 'Billing', count: 310, percentage: 24.9 },
    { category: 'Authentication', count: 234, percentage: 18.8 },
    { category: 'User Experience', count: 156, percentage: 12.5 },
    { category: 'Feature Request', count: 91, percentage: 7.3 }
  ],
  timeData: [
    { period: 'This Week', calls: 156, problems: 23, avgTime: 2.8 },
    { period: 'Last Week', calls: 134, problems: 19, avgTime: 3.1 },
    { period: 'This Month', calls: 678, problems: 89, avgTime: 3.0 },
    { period: 'Last Month', calls: 589, problems: 76, avgTime: 3.4 }
  ]
};

const adminAnalytics = {
  globalStats: {
    totalUsers: 247,
    totalCallsGlobal: 12847,
    totalProblemsGlobal: 1247,
    systemUptime: 99.8
  },
  userActivity: [
    { company: 'Tech Corp', users: 45, calls: 1234, problems: 167 },
    { company: 'Startup Inc', users: 23, calls: 567, problems: 89 },
    { company: 'Enterprise Solutions', users: 67, calls: 2345, problems: 234 },
    { company: 'Innovation Labs', users: 34, calls: 890, problems: 123 },
    { company: 'Digital Agency', users: 19, calls: 445, problems: 67 }
  ]
};

export function AnalyticsDashboard() {
  const { hasPermission } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendColor = (trend: string) => {
    return trend.startsWith('+') ? 'text-red-600' : 'text-green-600';
  };

  const filteredProblems = selectedCategory === 'all' 
    ? mockAnalytics.topProblems 
    : mockAnalytics.topProblems.filter(p => p.category.toLowerCase() === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analytics Dashboard</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="user experience">User Experience</SelectItem>
                  <SelectItem value="feature request">Feature Request</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls Analyzed</CardTitle>
            <FileAudio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasPermission('view_all_data') ? adminAnalytics.globalStats.totalCallsGlobal.toLocaleString() : mockAnalytics.overview.totalCalls}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problems Identified</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasPermission('view_all_data') ? adminAnalytics.globalStats.totalProblemsGlobal : mockAnalytics.overview.totalProblems}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.avgProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.accuracyRate}%</div>
            <Progress value={mockAnalytics.overview.accuracyRate} className="mt-2" />
          </CardContent>
        </Card>

        {hasPermission('view_all_data') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminAnalytics.globalStats.systemUptime}%</div>
              <Progress value={adminAnalytics.globalStats.systemUptime} className="mt-2" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Problems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Problems {selectedCategory !== 'all' && `(${selectedCategory})`}
              <Badge variant="outline">{filteredProblems.length} issues</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProblems.slice(0, 8).map((problem, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{problem.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getSeverityColor(problem.severity)} variant="secondary">
                          {problem.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{problem.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{problem.frequency}</div>
                    <div className={`text-sm ${getTrendColor(problem.trend)}`}>
                      {problem.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.categoryBreakdown.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-muted-foreground">
                      {category.count} ({category.percentage}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin-only sections */}
      {hasPermission('view_all_data') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Activity by Company</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminAnalytics.userActivity.map((company, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{company.company}</h3>
                    <p className="text-sm text-muted-foreground">{company.users} users</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Calls</p>
                        <p className="font-medium">{company.calls}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Problems</p>
                        <p className="font-medium">{company.problems}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Series Data */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mockAnalytics.timeData.map((period, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">{period.period}</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold">{period.calls}</p>
                    <p className="text-xs text-muted-foreground">calls processed</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium">{period.problems}</p>
                    <p className="text-xs text-muted-foreground">problems found</p>
                  </div>
                  <div>
                    <p className="text-sm">{period.avgTime}s avg</p>
                    <p className="text-xs text-muted-foreground">processing time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}