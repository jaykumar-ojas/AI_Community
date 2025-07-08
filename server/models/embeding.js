const mongoose = require('mongoose');

// Define the Post schema
const embedingschema = new mongoose.Schema({
  image_id: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  collection: {
    type: String,
    required: true,
    default: 'posts',
    enum: ['posts', 'images', 'media'] // Add more collections as needed
  },
  parent_id: {
    type: String,
    default: null,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const embeddingdb = mongoose.model('image_embeddings', embedingschema);

// Fixed: Added the missing 's' in exports
module.exports = embeddingdb;