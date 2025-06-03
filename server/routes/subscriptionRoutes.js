const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscriptionSchema');
const userdb = require('../models/userSchema');
const authenticate = require('../middleware/authenticate');
const googledb = require('../models/googleSchema');

// Helper function to ensure subscription document exists for a user
const ensureSubscriptionExists = async (userId) => {
    try {
        let subscription = await Subscription.findOne({ userId });
        if (!subscription) {
            subscription = new Subscription({
                userId,
                subscribers: [],
                subscribedTo: []
            });
            await subscription.save();
        }
        return subscription;
    } catch (error) {
        console.error("Error ensuring subscription exists:", error);
        throw error;
    }
};

// Subscribe to a user
router.post('/subscribe/:userId', authenticate, async (req, res) => {
    console.log("subscribe to user");
    try {
        const subscriberId = req.rootuser._id;
        const subscribedToId = req.params.userId;

        if (!subscriberId || !subscribedToId) {
            return res.status(400).json({ error: "Invalid user IDs" });
        }

        // Check if trying to subscribe to self
        if (subscriberId.toString() === subscribedToId) {
            return res.status(400).json({ error: "Cannot subscribe to yourself" });
        }

        // Check if user exists
        const userToSubscribe = await userdb.findById(subscribedToId) || await googledb.findById(subscribedToId);;
        


        console.log(userToSubscribe);
        if (!userToSubscribe) {
            return res.status(404).json({ error: "User not found" });
        }

        // Ensure both users have subscription documents
        const subscriberDoc = await ensureSubscriptionExists(subscriberId);
        const subscribedToDoc = await ensureSubscriptionExists(subscribedToId);

        // Check if already subscribed
        if (subscriberDoc.subscribedTo.includes(subscribedToId)) {
            return res.status(400).json({ error: "Already subscribed to this user" });
        }

        // Add to subscriber's subscribedTo array
        await Subscription.updateOne(
            { userId: subscriberId },
            { $addToSet: { subscribedTo: subscribedToId } }
        );

        // Add to target user's subscribers array
        await Subscription.updateOne(
            { userId: subscribedToId },
            { $addToSet: { subscribers: subscriberId } }
        );

        // Update user documents
        // await userdb.findByIdAndUpdate(subscriberId, {
        //     $addToSet: { subscribedTo: subscribedToId }
        // });

        // await userdb.findByIdAndUpdate(subscribedToId, {
        //     $addToSet: { subscribedBy: subscriberId }
        // });

        res.status(201).json({ message: "Successfully subscribed" });
    } catch (error) {
        console.error("Subscription error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from a user
router.delete('/unsubscribe/:userId', authenticate, async (req, res) => {
    try {
        const subscriberId = req.rootuser._id;
        const subscribedToId = req.params.userId;

        if (!subscriberId || !subscribedToId) {
            return res.status(400).json({ error: "Invalid user IDs" });
        }

        // Ensure both users have subscription documents
        const subscriberDoc = await ensureSubscriptionExists(subscriberId);
        const subscribedToDoc = await ensureSubscriptionExists(subscribedToId);

        // Check if actually subscribed
        if (!subscriberDoc.subscribedTo.includes(subscribedToId)) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        // Remove from subscriber's subscribedTo array
        await Subscription.updateOne(
            { userId: subscriberId },
            { $pull: { subscribedTo: subscribedToId } }
        );

        // Remove from target user's subscribers array
        await Subscription.updateOne(
            { userId: subscribedToId },
            { $pull: { subscribers: subscriberId } }
        );

        // // Update user documents
        // await userdb.findByIdAndUpdate(subscriberId, {
        //     $pull: { subscribedTo: subscribedToId }
        // });

        // await userdb.findByIdAndUpdate(subscribedToId, {
        //     $pull: { subscribedBy: subscriberId }
        // });

        res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all subscribers of a user
router.get('/subscribers', authenticate, async (req, res) => {
    try {
        const userId = req.rootuser._id;
        
        // Ensure subscription document exists
        const subscription = await ensureSubscriptionExists(userId);
        
        const populatedSubscription = await Subscription.findOne({ userId })
            .populate('subscribers', 'userName profilePicture profilePictureUrl');
        
        res.json(populatedSubscription.subscribers);
    } catch (error) {
        console.error("Get subscribers error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all users that the current user is subscribed to
router.get('/subscriptions', authenticate, async (req, res) => {
    try {
        const userId = req.rootuser._id;
        
        // Ensure subscription document exists
        const subscription = await ensureSubscriptionExists(userId);
        
        const populatedSubscription = await Subscription.findOne({ userId })
            .populate('subscribedTo', 'userName profilePicture profilePictureUrl');
        
        res.json(populatedSubscription.subscribedTo);
    } catch (error) {
        console.error("Get subscriptions error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Check if current user is subscribed to a specific user
router.get('/check/:userId', authenticate, async (req, res) => {
    try {
        const subscriberId = req.rootuser._id;
        const subscribedToId = req.params.userId;
        
        if (!subscriberId || !subscribedToId) {
            return res.status(400).json({ error: "Invalid user IDs" });
        }
        
        // Ensure subscription document exists
        const subscription = await ensureSubscriptionExists(subscriberId);
        const isSubscribed = subscription.subscribedTo.includes(subscribedToId);

        res.json({ isSubscribed });
    } catch (error) {
        console.error("Check subscription error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get subscription stats for a user
router.get('/stats/:userId?', authenticate, async (req, res) => {
    try {
        const userId = req.params.userId || req.rootuser._id;
        
        if (!userId) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        
        // Ensure subscription document exists
        const subscription = await ensureSubscriptionExists(userId);
        
        res.json({
            subscribersCount: subscription.subscribers.length,
            subscribedToCount: subscription.subscribedTo.length
        });
    } catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;