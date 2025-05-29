const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscriptionSchema');
const userdb = require('../models/userSchema');
const auth = require('../middleware/auth');

// Subscribe to a user
router.post('/subscribe/:userId', auth, async (req, res) => {
    try {
        const subscriberId = req.user._id;
        const subscribedToId = req.params.userId;

        // Check if trying to subscribe to self
        if (subscriberId.toString() === subscribedToId) {
            return res.status(400).json({ error: "Cannot subscribe to yourself" });
        }

        // Check if user exists
        const userToSubscribe = await userdb.findById(subscribedToId);
        if (!userToSubscribe) {
            return res.status(404).json({ error: "User not found" });
        }

        // Create subscription
        const subscription = new Subscription({
            subscriber: subscriberId,
            subscribedTo: subscribedToId
        });

        await subscription.save();

        // Update user documents
        await userdb.findByIdAndUpdate(subscriberId, {
            $addToSet: { subscribedTo: subscribedToId }
        });

        await userdb.findByIdAndUpdate(subscribedToId, {
            $addToSet: { subscribedBy: subscriberId }
        });

        res.status(201).json({ message: "Successfully subscribed", subscription });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Already subscribed to this user" });
        }
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from a user
router.delete('/unsubscribe/:userId', auth, async (req, res) => {
    try {
        const subscriberId = req.user._id;
        const subscribedToId = req.params.userId;

        // Delete subscription
        const subscription = await Subscription.findOneAndDelete({
            subscriber: subscriberId,
            subscribedTo: subscribedToId
        });

        if (!subscription) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        // Update user documents
        await userdb.findByIdAndUpdate(subscriberId, {
            $pull: { subscribedTo: subscribedToId }
        });

        await userdb.findByIdAndUpdate(subscribedToId, {
            $pull: { subscribedBy: subscriberId }
        });

        res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all subscribers of a user
router.get('/subscribers', auth, async (req, res) => {
    try {
        const user = await userdb.findById(req.user._id)
            .populate('subscribedBy', 'userName profilePicture profilePictureUrl');
        
        res.json(user.subscribedBy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users that the current user is subscribed to
router.get('/subscriptions', auth, async (req, res) => {
    try {
        const user = await userdb.findById(req.user._id)
            .populate('subscribedTo', 'userName profilePicture profilePictureUrl');
        
        res.json(user.subscribedTo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if current user is subscribed to a specific user
router.get('/check/:userId', auth, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            subscriber: req.user._id,
            subscribedTo: req.params.userId
        });

        res.json({ isSubscribed: !!subscription });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 