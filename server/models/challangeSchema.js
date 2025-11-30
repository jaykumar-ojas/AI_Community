const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ["daily", "weekly"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    rewardXP: {
      type: Number,
      default: 0,
    },

    estimatedTime: {
      type: String, // "5–10 min"
      default: "",
    },

    // 🔥 For calendar navigation
    date: {
      type: Date, // Each daily challenge belongs to a specific date
      required: function () {
        return this.type === "daily";
      },
    },

    weekStart: {
      type: Date, // For weekly challenges (optional)
    },

    // If challenge includes multiple content types
    formats: {
      image: { type: Boolean, default: false },
      video: { type: Boolean, default: false },
      text: { type: Boolean, default: false },
    },

    // For your “Open” → “Use AI Model / Share”
    extraTips: [
      {
        type: String,
      },
    ],

    // 🔥 Which users finished this challenge
    completedBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        completedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", ChallengeSchema);
