'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  File,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';

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
}

export function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start processing files
    newFiles.forEach(uploadFile => {
      processFile(uploadFile);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const processFile = async (uploadFile: UploadFile) => {
    setIsProcessing(true);
    
    try {
      // Simulate upload progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress } : f
        ));
      }

      // Simulate transcription and analysis
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'processing', progress: 100 } : f
      ));

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock results
      const mockTranscript = `Customer called about ${uploadFile.file.name.includes('payment') ? 'payment processing issues' : 'login problems'}. They were frustrated with the current system and requested immediate assistance. Multiple attempts to resolve the issue were mentioned during the call.`;
      
      const mockProblems = [
        {
          problem: uploadFile.file.name.includes('payment') ? 'Payment Processing Failure' : 'Login Authentication Issues',
          confidence: 0.92,
          category: uploadFile.file.name.includes('payment') ? 'Billing' : 'Authentication',
          frequency: Math.floor(Math.random() * 20) + 5
        },
        {
          problem: 'Poor User Experience',
          confidence: 0.78,
          category: 'UI/UX',
          frequency: Math.floor(Math.random() * 15) + 3
        },
        {
          problem: 'System Performance Issues',
          confidence: 0.65,
          category: 'Technical',
          frequency: Math.floor(Math.random() * 10) + 2
        }
      ];

      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'completed',
              transcript: mockTranscript,
              problems: mockProblems
            } 
          : f
      ));

      toast.success(`Analysis completed for ${uploadFile.file.name}`);
    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: 'Processing failed' }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Call Recordings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              Processing typically takes 2-5 minutes per file.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress ({uploadedFiles.length} files)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(uploadFile.status)}
                      <div>
                        <p className="font-medium">{uploadFile.file.name}</p>
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
                        <h5 className="text-sm font-medium mb-2">Top Problems Identified:</h5>
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
                                  {problem.frequency} occurrences
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
    </div>
  );
}