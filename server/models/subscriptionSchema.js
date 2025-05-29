const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    subscribedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index to prevent duplicate subscriptions
subscriptionSchema.index({ subscriber: 1, subscribedTo: 1 }, { unique: true });

const Subscription = mongoose.model("subscriptions", subscriptionSchema);

module.exports = Subscription; 