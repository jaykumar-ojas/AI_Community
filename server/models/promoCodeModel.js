const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  creditValue: {
    type: Number,
    required: true
  },

  priority: {
    type: Number,
    default: 1,
    min: 1
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
module.exports = PromoCode;
