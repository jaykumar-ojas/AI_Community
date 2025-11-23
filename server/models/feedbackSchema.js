const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
    {
        userId: { type: String, required: false }, // Optional if anonymous
        userName: { type: String, required: false }, // Optional if anonymous
        email: { type: String, required: false },
        category: { type: String, required: true, enum: ['Bug', 'Feature Request', 'Suggestion', 'Other'] },
        title: { type: String, required: true },
        priority: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
        description: { type: String, required: true },
        steps: { type: String, required: false },
        anonymous: { type: Boolean, default: false },
        status: { type: String, default: 'Open', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
    },
    { timestamps: true }
);

const feedbackDb = new mongoose.model("feedback", feedbackSchema);

module.exports = feedbackDb;

