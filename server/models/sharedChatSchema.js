const mongoose = require("mongoose");

const sharedMessageSchema = new mongoose.Schema(
  {
    userText: { type: String, trim: true, default: "" },
    aiText: { type: String, trim: true, default: "" },
    prompt: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true },
    model: { type: String, trim: true },
    provider: { type: String, trim: true },
    modelInfo: {
      providerName: { type: String, trim: true },
      modelName: { type: String, trim: true },
      iconUrl: { type: String, trim: true },
    },
    isMemoryAware: { type: Boolean, default: false },
    codeBlocks: [
      {
        language: { type: String, trim: true },
        code: String,
      },
    ],
  },
  { _id: false }
);

const contextNoteSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    body: { type: String, trim: true },
  },
  { _id: false }
);

const sharedChatSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    ownerName: { type: String, required: true, trim: true },
    ownerAvatar: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    tags: { type: [String], default: [] },
    coverImage: { type: String, trim: true },
    tone: { type: String, trim: true },
    conversation: { type: [sharedMessageSchema], default: [] },
    contextNotes: { type: [contextNoteSchema], default: [] },
    meta: {
      messageCount: { type: Number, default: 0 },
      lastModel: { type: String, trim: true },
      lastProvider: { type: String, trim: true },
      categories: { type: [String], default: [] },
    },
    allowContinuation: { type: Boolean, default: true },
    shareSlug: { type: String, unique: true, index: true },
    stats: {
      views: { type: Number, default: 0 },
      continuations: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

sharedChatSchema.pre("save", function (next) {
  this.meta = this.meta || {};
  this.meta.messageCount = this.conversation?.length || 0;
  if (this.conversation?.length) {
    const lastMessageWithModel = [...this.conversation]
      .reverse()
      .find((item) => item?.model || item?.modelInfo?.modelName);
    this.meta.lastModel =
      lastMessageWithModel?.model ||
      lastMessageWithModel?.modelInfo?.modelName ||
      this.meta.lastModel;
    this.meta.lastProvider =
      lastMessageWithModel?.provider ||
      lastMessageWithModel?.modelInfo?.providerName ||
      this.meta.lastProvider;
  }
  next();
});

const SharedChat = mongoose.model("SharedChat", sharedChatSchema);

module.exports = SharedChat;

