/**
 * ChatMessage Model - MongoDB Schema
 * Stores chatbot conversation history
 */
import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isHealthcareRelated: {
    type: Boolean,
    default: true
  },
  metadata: {
    tokens: Number,
    responseTime: Number,
    model: String
  }
}, {
  timestamps: true
});

// Index for faster session retrieval
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

// Static method to get conversation history
chatMessageSchema.statics.getConversation = async function(sessionId, limit = 20) {
  return this.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .sort({ createdAt: 1 });
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
