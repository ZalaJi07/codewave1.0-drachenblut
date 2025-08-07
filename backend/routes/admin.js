const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Call = require('../models/Call');

const router = express.Router();

// Get all users (admin/super_admin only)
router.get('/users', auth, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.company) {
      query.company = new RegExp(req.query.company, 'i');
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get call counts for each user
    const userIds = users.map(user => user._id);
    const callCounts = await Call.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    const callCountMap = {};
    callCounts.forEach(item => {
      callCountMap[item._id.toString()] = item.count;
    });

    const usersWithStats = users.map(user => ({
      ...user.toObject(),
      totalCalls: callCountMap[user._id.toString()] || 0
    }));

    res.json({
      users: usersWithStats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to retrieve users'
    });
  }
});

// Get user details with call history
router.get('/user/:userId', auth, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get user's calls
    const calls = await Call.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-filePath');

    // Get user statistics
    const stats = await Call.getUserStats(req.params.userId);

    res.json({
      user,
      recentCalls: calls,
      stats: stats[0] || { totalCalls: 0, completedCalls: 0, avgProcessingTime: 0, totalProblems: 0 }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user details'
    });
  }
});

// Update user status (suspend/activate)
router.patch('/user/:userId/status', auth, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be a boolean'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status'
    });
  }
});

// Update user quota
router.patch('/user/:userId/quota', auth, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { quotaLimit } = req.body;
    
    if (!Number.isInteger(quotaLimit) || quotaLimit < 0) {
      return res.status(400).json({
        message: 'quotaLimit must be a positive integer'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { quotaLimit },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'User quota updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user quota error:', error);
    res.status(500).json({
      message: 'Failed to update user quota'
    });
  }
});

// Delete user
router.delete('/user/:userId', auth, authorize('super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Delete all user's calls and files
    const calls = await Call.find({ userId: req.params.userId });
    const fs = require('fs').promises;
    
    for (const call of calls) {
      try {
        await fs.unlink(call.filePath);
      } catch (fileError) {
        console.error(`Failed to delete file ${call.filePath}:`, fileError);
      }
    }

    await Call.deleteMany({ userId: req.params.userId });
    await User.findByIdAndDelete(req.params.userId);

    res.json({
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Failed to delete user'
    });
  }
});

// Get all calls (admin/super_admin only)
router.get('/calls', auth, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.analysisStatus = req.query.status;
    }
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    const calls = await Call.find(query)
      .populate('userId', 'email company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    console.error('Get all calls error:', error);
    res.status(500).json({
      message: 'Failed to retrieve calls'
    });
  }
});

// Get system-wide analytics
router.get('/analytics', auth, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const timeRange = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

    // Get basic stats
    const [totalUsers, activeUsers, totalCalls, completedCalls] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Call.countDocuments({ createdAt: { $gte: startDate } }),
      Call.countDocuments({ createdAt: { $gte: startDate }, analysisStatus: 'completed' })
    ]);

    // Get problem trends
    const problemTrends = await Call.getProblemTrends(null, timeRange);

    // Get user activity by company
    const userActivity = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'calls',
          localField: '_id',
          foreignField: 'userId',
          as: 'calls'
        }
      },
      {
        $group: {
          _id: '$company',
          userCount: { $sum: 1 },
          totalCalls: { $sum: { $size: '$calls' } },
          completedCalls: {
            $sum: {
              $size: {
                $filter: {
                  input: '$calls',
                  cond: { $eq: ['$$this.analysisStatus', 'completed'] }
                }
              }
            }
          }
        }
      },
      { $sort: { totalCalls: -1 } },
      { $limit: 10 }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Call.aggregate([
      { $match: { createdAt: { $gte: startDate }, analysisStatus: 'completed' } },
      { $unwind: '$topProblems' },
      {
        $group: {
          _id: '$topProblems.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get processing performance
    const processingStats = await Call.aggregate([
      { $match: { createdAt: { $gte: startDate }, analysisStatus: 'completed' } },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' },
          minProcessingTime: { $min: '$processingTime' },
          maxProcessingTime: { $max: '$processingTime' }
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalCalls,
        completedCalls,
        successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0
      },
      problemTrends,
      userActivity: userActivity.map(item => ({
        company: item._id,
        users: item.userCount,
        calls: item.totalCalls,
        completedCalls: item.completedCalls
      })),
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item._id,
        count: item.count
      })),
      processing: processingStats[0] || {
        avgProcessingTime: 0,
        minProcessingTime: 0,
        maxProcessingTime: 0
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      message: 'Failed to retrieve analytics'
    });
  }
});

module.exports = router;