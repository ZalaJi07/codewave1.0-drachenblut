const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const Call = require('../models/Call');
const { auth, checkQuota } = require('../middleware/auth');
const { transcribeAudio, analyzeProblems } = require('../services/audioProcessing');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_AUDIO_TYPES || 'mp3,wav,m4a,aac').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Upload and process audio file
router.post('/upload', auth, checkQuota, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No audio file provided'
      });
    }

    // Create call record
    const call = new Call({
      userId: req.user.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      language: req.body.language || 'auto',
      isPrivate: req.body.isPrivate === 'true',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      analysisStatus: 'pending'
    });

    await call.save();

    // Update user quota
    await req.userModel.updateQuotaUsage(1);

    // Start processing asynchronously
    processCallAsync(call._id);

    res.status(201).json({
      message: 'File uploaded successfully. Processing started.',
      callId: call._id,
      fileName: call.originalName,
      status: call.analysisStatus
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's calls
router.get('/user/:userId?', auth, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    
    // Only allow users to see their own calls unless they're admin
    if (userId !== req.user.userId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId };
    if (req.query.status) {
      query.analysisStatus = req.query.status;
    }

    const calls = await Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath'); // Don't expose file paths

    const total = await Call.countDocuments(query);

    res.json({
      calls,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({
      message: 'Failed to retrieve calls'
    });
  }
});

// Get specific call details
router.get('/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    
    if (!call) {
      return res.status(404).json({
        message: 'Call not found'
      });
    }

    // Check access permissions
    if (call.userId.toString() !== req.user.userId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Don't expose file path to non-admins
    const callData = call.toObject();
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      delete callData.filePath;
    }

    res.json({ call: callData });
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({
      message: 'Failed to retrieve call'
    });
  }
});

// Delete call
router.delete('/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    
    if (!call) {
      return res.status(404).json({
        message: 'Call not found'
      });
    }

    // Check access permissions
    if (call.userId.toString() !== req.user.userId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(call.filePath);
    } catch (fileError) {
      console.error('Failed to delete audio file:', fileError);
    }

    // Delete from database
    await Call.findByIdAndDelete(req.params.callId);

    // Update user quota (refund)
    if (call.userId.toString() === req.user.userId) {
      const User = require('../models/User');
      const user = await User.findById(req.user.userId);
      user.quotaUsed = Math.max(0, user.quotaUsed - 1);
      await user.save();
    }

    res.json({
      message: 'Call deleted successfully'
    });
  } catch (error) {
    console.error('Delete call error:', error);
    res.status(500).json({
      message: 'Failed to delete call'
    });
  }
});

// Stream audio file
router.get('/audio/:callId/stream', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    
    if (!call) {
      return res.status(404).json({
        message: 'Call not found'
      });
    }

    // Check access permissions
    if (call.userId.toString() !== req.user.userId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(call.filePath);
    } catch {
      return res.status(404).json({
        message: 'Audio file not found'
      });
    }

    // Stream the file
    const stat = await fs.stat(call.filePath);
    const range = req.headers.range;

    if (range) {
      // Handle range requests for audio streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = (end - start) + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': call.mimeType,
      });

      const stream = require('fs').createReadStream(call.filePath, { start, end });
      stream.pipe(res);
    } else {
      res.set({
        'Content-Type': call.mimeType,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
      });

      const stream = require('fs').createReadStream(call.filePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Stream audio error:', error);
    res.status(500).json({
      message: 'Failed to stream audio'
    });
  }
});

// Get user statistics
router.get('/stats/user', auth, async (req, res) => {
  try {
    const stats = await Call.getUserStats(req.user.userId);
    res.json({ stats: stats[0] || { totalCalls: 0, completedCalls: 0, avgProcessingTime: 0, totalProblems: 0 } });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve statistics'
    });
  }
});

// Get problem trends
router.get('/trends/problems', auth, async (req, res) => {
  try {
    const timeRange = parseInt(req.query.days) || 30;
    const userId = ['admin', 'super_admin'].includes(req.user.role) ? null : req.user.userId;
    
    const trends = await Call.getProblemTrends(userId, timeRange);
    res.json({ trends });
  } catch (error) {
    console.error('Get problem trends error:', error);
    res.status(500).json({
      message: 'Failed to retrieve problem trends'
    });
  }
});

// Async function to process call
async function processCallAsync(callId) {
  try {
    const call = await Call.findById(callId);
    if (!call) return;

    // Update status to transcribing
    call.analysisStatus = 'transcribing';
    await call.save();

    // Transcribe audio
    const transcriptionResult = await transcribeAudio(call.filePath, call.language);
    
    call.transcript = transcriptionResult.transcript;
    call.transcriptConfidence = transcriptionResult.confidence;
    call.analysisStatus = 'analyzing';
    await call.save();

    // Analyze problems
    const analysisResult = await analyzeProblems(call.transcript);
    
    call.topProblems = analysisResult.problems;
    call.analytics = analysisResult.analytics;
    call.analysisStatus = 'completed';
    await call.save();

  } catch (error) {
    console.error('Call processing error:', error);
    
    // Update call with error status
    await Call.findByIdAndUpdate(callId, {
      analysisStatus: 'failed',
      errorMessage: error.message
    });
  }
}

module.exports = router;