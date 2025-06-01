const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    subscribedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
subscriptionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create compound index for userId
subscriptionSchema.index({ userId: 1 }, { unique: true });

const Subscription = mongoose.model("subscriptions", subscriptionSchema);

module.exports = Subscription;