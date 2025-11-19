const express = require('express');
const router = new express.Router();
const feedbackDb = require("../models/feedbackSchema");
const authenticate = require('../middleware/authenticate');

// Submit feedback
router.post('/feedback/submit', async (req, res) => {
    try {
        const { 
            category, 
            title, 
            priority, 
            description, 
            steps, 
            email, 
            anonymous 
        } = req.body;

        // Basic validation
        if (!category || !title || !priority || !description) {
            return res.status(400).json({ 
                status: 400, 
                error: "Missing required fields: category, title, priority, and description are required" 
            });
        }

        // Get user info if authenticated (from token)
        let userId = null;
        let userName = null;
        
        try {
            const token = req.cookies?.userdatatoken || req.headers?.authorization?.replace('Bearer ', '');
            if (token && !anonymous) {
                // Try to decode the token manually to get user info
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded._id) {
                    userId = decoded._id;
                    userName = decoded.userName || null;
                }
            }
        } catch (authError) {
            // User not authenticated or invalid token, that's okay for feedback
            console.log("User not authenticated or invalid token, submitting anonymous feedback");
        }

        const feedback = new feedbackDb({
            userId: anonymous ? null : userId,
            userName: anonymous ? null : userName,
            email: email || null,
            category,
            title,
            priority,
            description,
            steps: steps || '',
            anonymous: anonymous || false,
            status: 'Open'
        });

        const savedFeedback = await feedback.save();

        return res.status(201).json({
            status: 201,
            message: "Feedback submitted successfully",
            feedback: {
                id: savedFeedback._id,
                title: savedFeedback.title,
                category: savedFeedback.category
            }
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return res.status(500).json({ 
            status: 500, 
            error: "Failed to submit feedback. Please try again." 
        });
    }
});

// Get all feedback (for admin, optional)
router.get('/feedback/getAll', authenticate, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = 20;
        const skip = (page - 1) * limit;

        const totalCount = await feedbackDb.countDocuments();
        const feedbacks = await feedbackDb
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            status: 200,
            data: feedbacks,
            totalCount,
            page,
            pageSize: limit,
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return res.status(500).json({ 
            status: 500, 
            error: "Failed to fetch feedback" 
        });
    }
});

module.exports = router;

