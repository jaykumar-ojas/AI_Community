const express = require('express');
const router = new express.Router();

const notificationDb = require("../models/notificationSchema");
const authenticate = require('../middleware/authenticate');

// make it for pagination fetching
router.get('/getNotification/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));

    // compute limit and skip according to the rule
    let limit, skip;
    if (page === 1) {
      limit = 50;
      skip = 0;
    } else {
      limit = 20;
      skip = 50 + (page - 2) * 20;
    }

    // total counts
    const [ totalCount, unreadCount ] = await Promise.all([
      notificationDb.countDocuments({ userId }),
      notificationDb.countDocuments({ userId, read: { $ne: true } }) // assume `read` is bool
    ]);

    // fetch notifications sorted by newest first (adjust sort if needed)
    const notifications = await notificationDb
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      status: 200,
      data: notifications,
      totalCount,
      unreadCount,
      page,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ status: 500, error: "Failed to fetch notifications" });
  }
});

/**
 * POST /getNotification/:userId/mark-all-read
 * Marks ALL unread notifications for the user as read.
 * Useful to call when user opens the notification panel.
 */
router.post('/getNotification/:userId/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await notificationDb.updateMany(
      { userId, read: { $ne: true } }, // select unread
      { $set: { read: true, readAt: new Date() } } // set read flag (and optional timestamp)
    );

    // return new unread count (should be 0)
    const unreadCount = await notificationDb.countDocuments({ userId, read: { $ne: true } });

    return res.status(200).json({
      status: 200,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      unreadCount,
    });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return res.status(500).json({ status: 500, error: "Failed to mark notifications read" });
  }
});

/**
 * Optional: Mark single notification read/dismiss endpoints (example)
 * - POST /getNotification/:userId/mark-read { id }
 * - POST /getNotification/:userId/dismiss { id }
 */
router.post('/getNotification/:userId/mark-read', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: 400, error: "Missing id" });

    const result = await notificationDb.updateOne(
      { _id: id, userId },
      { $set: { read: true, readAt: new Date() } }
    );

    return res.status(200).json({ status: 200, modifiedCount: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({ status: 500, error: "Failed to mark notification read" });
  }
});

router.post('/getNotification/:userId/dismiss', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: 400, error: "Missing id" });

    // either remove or set `dismissed` flag depending on your schema preference
    const result = await notificationDb.deleteOne({ _id: id, userId });

    return res.status(200).json({ status: 200, deletedCount: result.deletedCount ?? 0 });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return res.status(500).json({ status: 500, error: "Failed to dismiss notification" });
  }
});

// GET /getNotification/unreadCount/:userId
router.get('/getNotification/unreadCount/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID missing" });
    }

    // Count unread notifications (read:false or read missing)
    const unreadCount = await notificationDb.countDocuments({
      userId,
      read: { $ne: true }  // includes read: false or read not present
    });

    return res.status(200).json({
      status: 200,
      unreadCount: unreadCount
    });

  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error while fetching unread count"
    });
  }
});


module.exports = router;
