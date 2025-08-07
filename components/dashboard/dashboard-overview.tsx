'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileAudio,
  Users,
  Eye,
  Upload,
  File,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Volume2,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

// API Types
interface DashboardStats {
  totalCalls: number;
  totalUsers?: number;
  growth: string;
}

interface Problem {
  id: string;
  name: string;
  count?: number;
  frequency?: number;
  users?: number;
  trend?: string;
}

interface Recording {
  id: string;
  fileName: string;
  duration: string;
  uploadedBy: string;
  uploadDate: string;
  status: string;
  transcript: string;
  problemId: string;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  transcript?: string;
  problems?: Array<{
    problem: string;
    confidence: number;
    category: string;
    frequency: number;
  }>;
  error?: string;
  isRecorded?: boolean;
}

interface DashboardOverviewProps {
  onNavigate: (page: string) => void;
}

// API Functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return apiRequest('/dashboard/stats');
};

const fetchProblems = async (isAdmin: boolean): Promise<Problem[]> => {
  const endpoint = isAdmin ? '/problems/global' : '/problems/user';
  return apiRequest(endpoint);
};

const fetchRecordingsByProblem = async (problemId: string): Promise<Recording[]> => {
  return apiRequest(`/recordings/by-problem/${problemId}`);
};

const uploadFileToAPI = async (file: File, isRecorded: boolean = false): Promise<any> => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('isRecorded', String(isRecorded));

  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}/recordings/upload`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

const pollAnalysisStatus = async (recordingId: string): Promise<any> => {
  return apiRequest(`/recordings/${recordingId}/status`);
};

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user, hasPermission } = useAuth();
  
  // API Data States
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  
  // UI States
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('frequency');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [transcriptVisible, setTranscriptVisible] = useState<Record<string, boolean>>({});
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio references for recordings in modal
  const recordingAudioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Load initial data
  useEffect(() => {
    loadDashboardStats();
    loadProblems();
  }, [hasPermission]);

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await fetchDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadProblems = async () => {
    try {
      setIsLoadingProblems(true);
      const problemsData = await fetchProblems(hasPermission('view_all_data'));
      setProblems(problemsData);
    } catch (error) {
      toast.error('Failed to load problems data');
      console.error('Problems loading error:', error);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const loadRecordingsByProblem = async (problem: Problem) => {
    try {
      setIsLoadingRecordings(true);
      const recordingsData = await fetchRecordingsByProblem(problem.id);
      setRecordings(recordingsData);
    } catch (error) {
      toast.error('Failed to load recordings for this problem');
      console.error('Recordings loading error:', error);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  // Handle problem click to open modal
  const handleProblemClick = async (problem: Problem) => {
    setSelectedProblem(problem);
    setIsModalOpen(true);
    setTranscriptVisible({});
    await loadRecordingsByProblem(problem);
  };

  // Toggle transcript visibility
  const toggleTranscript = (recordingId: string) => {
    setTranscriptVisible(prev => ({
      ...prev,
      [recordingId]: !prev[recordingId]
    }));
  };

  // Handle recording play/pause
  const handleRecordingPlayPause = (recordingId: string) => {
    // Stop currently playing audio if different
    if (currentlyPlaying && currentlyPlaying !== recordingId) {
      const currentAudio = recordingAudioRefs.current[currentlyPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    const audio = recordingAudioRefs.current[recordingId];
    
    if (!audio) {
      // Create new audio element - you'll need to implement audio streaming from your backend
      const newAudio = new Audio(`${API_BASE_URL}/recordings/${recordingId}/stream`);
      recordingAudioRefs.current[recordingId] = newAudio;
      
      newAudio.onended = () => {
        setCurrentlyPlaying(null);
      };
      
      newAudio.onerror = () => {
        toast.error('Error playing audio file');
      };
    }

    const audioElement = recordingAudioRefs.current[recordingId];

    if (currentlyPlaying === recordingId) {
      audioElement.pause();
      setCurrentlyPlaying(null);
    } else {
      audioElement.play().catch(() => {
        toast.error('Unable to play audio. File may not be available.');
      });
      setCurrentlyPlaying(recordingId);
    }
  };

  // Filter and sort function
  const getFilteredAndSortedProblems = () => {
    let filteredProblems = [...problems];
    
    // Filter by search term
    if (searchTerm) {
      filteredProblems = filteredProblems.filter(problem => 
        problem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort problems
    filteredProblems.sort((a, b) => {
      let aValue, bValue;
      
      if (sortOption === 'frequency') {
        aValue = a.frequency || a.count || 0;
        bValue = b.frequency || b.count || 0;
      } else if (sortOption === 'users') {
        aValue = a.users || 0;
        bValue = b.users || 0;
      } else { // name
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        return sortOrder === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
    
    return filteredProblems;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending',
      isRecorded: false
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(uploadFile => {
      processFile(uploadFile);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true
  });

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.success('Recording stopped');
    }
  };

  const playRecording = () => {
    if (recordedBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(recordedBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const pauseRecording = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const uploadRecording = () => {
    if (recordedBlob) {
      const recordedFile = new File([recordedBlob], `recording_${Date.now()}.wav`, {
        type: 'audio/wav'
      });

      const uploadFile: UploadFile = {
        id: Math.random().toString(36).substring(7),
        file: recordedFile,
        progress: 0,
        status: 'pending',
        isRecorded: true
      };

      setUploadedFiles(prev => [...prev, uploadFile]);
      processFile(uploadFile);
      resetRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processFile = async (uploadFile: UploadFile) => {
    setIsProcessing(true);
    
    try {
      // Update status to uploading
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      // Upload file to backend
      const uploadResponse = await uploadFileToAPI(uploadFile.file, uploadFile.isRecorded);
      const recordingId = uploadResponse.recordingId;

      // Simulate progress for UI
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress } : f
        ));
      }

      // Update to processing status
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'processing', progress: 100 } : f
      ));

      // Poll for analysis completion
      const pollForCompletion = async () => {
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max

        while (attempts < maxAttempts) {
          try {
            const statusResponse = await pollAnalysisStatus(recordingId);
            
            if (statusResponse.status === 'completed') {
              setUploadedFiles(prev => prev.map(f => 
                f.id === uploadFile.id 
                  ? { 
                      ...f, 
                      status: 'completed',
                      transcript: statusResponse.transcript,
                      problems: statusResponse.problems
                    } 
                  : f
              ));
              
              toast.success(`Analysis completed for ${uploadFile.file.name}`);
              // Refresh problems data to get updated counts
              loadProblems();
              break;
            } else if (statusResponse.status === 'failed') {
              throw new Error(statusResponse.error || 'Analysis failed');
            }
            
            // Wait 10 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 10000));
            attempts++;
          } catch (error) {
            console.error('Polling error:', error);
            attempts++;
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error('Analysis timeout - please try again');
        }
      };

      await pollForCompletion();

    } catch (error) {
      console.error('Upload/processing error:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' }
          : f
      ));
      
      toast.error(`Failed to process ${uploadFile.file.name}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
      case 'uploading':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'uploading':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Cards - Conditional Layout */}
      {hasPermission('view_all_data') ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Call Recordings</CardTitle>
              <FileAudio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-lg">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardStats?.totalCalls || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.growth || '+0% from last month'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-lg">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardStats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Platform users</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Call Recordings</CardTitle>
              <FileAudio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-lg">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardStats?.totalCalls || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.growth || '+0% from last month'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Section */}
      {hasPermission('view_all_data') ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              {/* Title and Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="text-lg font-semibold">
                  Ranked Top Problems
                </CardTitle>
                
                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-3 lg:flex-1 lg:max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search problems..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortOption} onValueChange={setSortOption}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frequency">Frequency</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      className="px-3"
                    >
                      {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Problems List */}
            {isLoadingProblems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading problems...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredAndSortedProblems().length > 0 ? (
                  getFilteredAndSortedProblems().map((problem, index) => (
                    <div 
                      key={problem.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleProblemClick(problem)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{problem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {problem.frequency 
                              ? `${problem.frequency} reports from ${problem.users} users`
                              : `${problem.count} occurrences`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {problem.trend && (
                          <Badge variant={problem.trend.startsWith('+') ? 'default' : 'secondary'}>
                            {problem.trend}
                          </Badge>
                        )}
                        {problem.frequency && (
                          <Badge variant="outline" className="text-xs">
                            <Filter className="h-3 w-3 mr-1" />
                            {problem.frequency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No problems found matching your search.</p>
                  </div>
                )}
              </div>
            )}

            {/* Results Summary */}
            {searchTerm && !isLoadingProblems && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {getFilteredAndSortedProblems().length} of {problems.length} problems
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upload and Record Tabs for Normal Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileAudio className="h-5 w-5" />
                <span>Call Recordings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload Files</span>
                  </TabsTrigger>
                  <TabsTrigger value="record" className="flex items-center space-x-2">
                    <Mic className="h-4 w-4" />
                    <span>Record Live</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  <div
                    {...getRootProps()}
                    className={`upload-zone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragActive 
                        ? 'border-primary bg-primary/5 drag-over' 
                        : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-medium mb-2">
                      {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Supports MP3, WAV, M4A, AAC files up to 50MB each
                    </p>
                    <Button type="button" variant="outline">
                      Choose Files
                    </Button>
                  </div>

                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Uploaded calls will be automatically transcribed and analyzed for common customer issues.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="record" className="mt-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Mic className={`mx-auto h-12 w-12 mb-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-medium mb-2">Record Live Call</h3>
                    <p className="text-gray-600 mb-6">
                      Record audio directly from your microphone
                    </p>

                    {isRecording && (
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-red-600 mb-2">
                          {formatTime(recordingTime)}
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-red-600">Recording...</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center space-x-4 mb-4">
                      {!isRecording && !recordedBlob && (
                        <Button onClick={startRecording} className="flex items-center space-x-2">
                          <Mic className="h-4 w-4" />
                          <span>Start Recording</span>
                        </Button>
                      )}

                      {isRecording && (
                        <Button onClick={stopRecording} variant="destructive" className="flex items-center space-x-2">
                          <Square className="h-4 w-4" />
                          <span>Stop Recording</span>
                        </Button>
                      )}

                      {recordedBlob && !isRecording && (
                        <div className="flex space-x-2">
                          <Button 
                            onClick={isPlaying ? pauseRecording : playRecording}
                            variant="outline"
                            className="flex items-center space-x-2"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            <span>{isPlaying ? 'Pause' : 'Play'}</span>
                          </Button>
                          <Button onClick={resetRecording} variant="outline" className="flex items-center space-x-2">
                            <RotateCcw className="h-4 w-4" />
                            <span>Reset</span>
                          </Button>
                          <Button onClick={uploadRecording} className="flex items-center space-x-2">
                            <Upload className="h-4 w-4" />
                            <span>Upload Recording</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {recordedBlob && (
                      <div className="text-sm text-green-600 mb-2">
                        Recording complete! Duration: {formatTime(recordingTime)}
                      </div>
                    )}
                  </div>

                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ensure you have a good microphone connection and are in a quiet environment for best results.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Queue ({uploadedFiles.length} files)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFiles.map((uploadFile) => (
                    <div key={uploadFile.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(uploadFile.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{uploadFile.file.name}</p>
                              {uploadFile.isRecorded && (
                                <Badge variant="secondary" className="text-xs">
                                  <Mic className="h-3 w-3 mr-1" />
                                  Recorded
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(uploadFile.file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(uploadFile.status)}>
                            {uploadFile.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="mb-2" />
                      )}

                      {uploadFile.status === 'processing' && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <Clock className="h-4 w-4 animate-pulse" />
                          <span>Analyzing audio and extracting problems...</span>
                        </div>
                      )}

                      {uploadFile.status === 'error' && uploadFile.error && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{uploadFile.error}</AlertDescription>
                        </Alert>
                      )}

                      {uploadFile.status === 'completed' && uploadFile.problems && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-medium text-green-600">Analysis Complete</h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h5 className="text-sm font-medium mb-2">Problems Identified:</h5>
                            <div className="space-y-2">
                              {uploadFile.problems.map((problem, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="font-medium">{problem.problem}</span>
                                    <span className="text-gray-600 ml-2">({problem.category})</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">
                                      {Math.round(problem.confidence * 100)}% confidence
                                    </Badge>
                                    <Badge variant="secondary">
                                      {problem.frequency} reports
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Problem Recordings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <Volume2 className="h-6 w-6" />
              <span>Recordings for: {selectedProblem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="mt-6 max-h-[70vh] w-full">
            {isLoadingRecordings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading recordings...</span>
              </div>
            ) : (
              <div className="space-y-6 pr-4">
                {recordings.length > 0 ? (
                  recordings.map((recording) => (
                    <div key={recording.id} className="border rounded-lg p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <FileAudio className="h-6 w-6 text-gray-500" />
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{recording.fileName}</h4>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mt-2">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Duration: {recording.duration}</span>
                              </span>
                              <span>•</span>
                              <span>Uploaded: {recording.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTranscript(recording.id)}
                            className="flex items-center space-x-2"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Show Transcript</span>
                            {transcriptVisible[recording.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRecordingPlayPause(recording.id)}
                            className="flex items-center space-x-2"
                          >
                            {currentlyPlaying === recording.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            <span>{currentlyPlaying === recording.id ? 'Pause' : 'Play'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm mb-4">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Uploaded by:</span>
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {recording.uploadedBy}
                        </Badge>
                      </div>
                      
                      {currentlyPlaying === recording.id && (
                        <div className="mb-4 flex items-center space-x-3 p-3 bg-green-50 rounded-md border border-green-200">
                          <Volume2 className="h-5 w-5 text-green-600 animate-pulse" />
                          <div className="text-sm text-green-700 font-medium">Now Playing...</div>
                        </div>
                      )}

                      {/* Transcript Section */}
                      {transcriptVisible[recording.id] && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-2 mb-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <h5 className="font-medium text-gray-800">Call Transcript</h5>
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded border">
                            {recording.transcript}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileAudio className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No recordings found for this problem.</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              {recordings.length} recordings found for this problem
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
