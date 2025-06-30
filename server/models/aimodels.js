const mongoose = require("mongoose");

const aiModelSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  providerName: {
    type: String,
    required: true,
    trim: true,
  },
  iconUrl: {
    type: String,
    required: true,
    trim: true,
  },
});

const AiModel = mongoose.model("AiModel", aiModelSchema);

module.exports = AiModel;