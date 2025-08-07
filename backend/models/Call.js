const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  problem: {
    type: String,
    required: true
  },
  frequency: {
    type: Number,
    default: 1
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  examples: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'Authentication', 'User Experience', 'Feature Request', 'Security', 'Performance', 'Other'],
    default: 'Other'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  keywords: [{
    type: String
  }],
  context: {
    type: String
  }
});

const callSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  duration: {
    type: Number // in seconds
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'gu', 'auto'],
    default: 'auto'
  },
  transcript: {
    type: String
  },
  transcriptConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  topProblems: [problemSchema],
  analysisStatus: {
    type: String,
    enum: ['pending', 'transcribing', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  processingStartedAt: {
    type: Date
  },
  processingCompletedAt: {
    type: Date
  },
  processingTime: {
    type: Number // in milliseconds
  },
  errorMessage: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  metadata: {
    apiVersion: String,
    processingModel: String,
    audioQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    backgroundNoise: {
      type: String,
      enum: ['none', 'low', 'medium', 'high']
    }
  },
  analytics: {
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1
    },
    emotionAnalysis: {
      dominant: String,
      confidence: Number
    },
    speakerCount: Number,
    callType: {
      type: String,
      enum: ['inbound', 'outbound', 'internal', 'unknown'],
      default: 'unknown'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ analysisStatus: 1 });
callSchema.index({ 'topProblems.category': 1 });
callSchema.index({ 'topProblems.severity': 1 });
callSchema.index({ language: 1 });
callSchema.index({ isPrivate: 1 });
callSchema.index({ tags: 1 });

// Compound index for admin queries
callSchema.index({ createdAt: -1, analysisStatus: 1 });

// Virtual for processing duration
callSchema.virtual('processingDuration').get(function() {
  if (this.processingStartedAt && this.processingCompletedAt) {
    return this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
  }
  return null;
});

// Virtual for file size in human readable format
callSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Pre-save middleware
callSchema.pre('save', function(next) {
  // Set processing times
  if (this.isModified('analysisStatus')) {
    if (this.analysisStatus === 'transcribing' && !this.processingStartedAt) {
      this.processingStartedAt = new Date();
    } else if (this.analysisStatus === 'completed' && !this.processingCompletedAt) {
      this.processingCompletedAt = new Date();
      if (this.processingStartedAt) {
        this.processingTime = this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
      }
    }
  }
  
  // Auto-categorize problems based on keywords
  if (this.isModified('topProblems')) {
    this.topProblems.forEach(problem => {
      if (!problem.category || problem.category === 'Other') {
        problem.category = categorizeProblem(problem.problem);
      }
      
      if (!problem.severity) {
        problem.severity = calculateSeverity(problem.confidence, problem.frequency);
      }
    });
  }
  
  next();
});

// Static method to get user's call statistics
callSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$analysisStatus', 'completed'] }, 1, 0] }
        },
        avgProcessingTime: { $avg: '$processingTime' },
        totalProblems: { $sum: { $size: '$topProblems' } }
      }
    }
  ]);
};

// Static method to get problem trends
callSchema.statics.getProblemTrends = function(userId = null, timeRange = 30) {
  const matchStage = {
    createdAt: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) },
    analysisStatus: 'completed'
  };
  
  if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$topProblems' },
    {
      $group: {
        _id: '$topProblems.problem',
        frequency: { $sum: '$topProblems.frequency' },
        avgConfidence: { $avg: '$topProblems.confidence' },
        category: { $first: '$topProblems.category' },
        severity: { $first: '$topProblems.severity' },
        occurrences: { $sum: 1 }
      }
    },
    { $sort: { frequency: -1 } },
    { $limit: 20 }
  ]);
};

// Helper function to categorize problems
function categorizeProblem(problemText) {
  const text = problemText.toLowerCase();
  
  if (text.includes('payment') || text.includes('billing') || text.includes('subscription') || text.includes('charge')) {
    return 'Billing';
  } else if (text.includes('login') || text.includes('authentication') || text.includes('password') || text.includes('access')) {
    return 'Authentication';
  } else if (text.includes('ui') || text.includes('interface') || text.includes('experience') || text.includes('usability')) {
    return 'User Experience';
  } else if (text.includes('security') || text.includes('privacy') || text.includes('hack') || text.includes('breach')) {
    return 'Security';
  } else if (text.includes('performance') || text.includes('slow') || text.includes('loading') || text.includes('timeout')) {
    return 'Performance';
  } else if (text.includes('feature') || text.includes('request') || text.includes('enhancement')) {
    return 'Feature Request';
  } else if (text.includes('bug') || text.includes('error') || text.includes('crash') || text.includes('technical')) {
    return 'Technical';
  }
  
  return 'Other';
}

// Helper function to calculate severity
function calculateSeverity(confidence, frequency) {
  const score = confidence * 0.7 + (frequency / 100) * 0.3;
  
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

module.exports = mongoose.model('Call', callSchema);