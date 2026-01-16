/**
 * MongoDB ChatSession Model
 * 
 * Stores persistent chat history with messages and attachments
 * 
 * Schema:
 * - userId: User who owns this session (indexed)
 * - id: Unique session identifier
 * - title: User-friendly session title
 * - timestamp: Creation time for sorting
 * - messages: Array of Message documents with file attachments
 * 
 * Features:
 * - Compound index on userId + timestamp for efficient queries
 * - Message embedding for quick access
 * - File context storage for document context
 * - Multiple response tracking per message
 * - Automatic timestamps (createdAt, updatedAt)
 */

import mongoose from 'mongoose';

const FileContextSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['pdf', 'image', 'txt', 'docx', 'xlsx', 'csv', 'pptx'],
        required: true,
    },
    data: {
        type: String,
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
}, { _id: false });

const MessageSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'bot'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    file: FileContextSchema,
    isCached: {
        type: Boolean,
        default: false,
    },
    responses: [{
        type: String,
    }],
    currentResponseIndex: {
        type: Number,
        default: 0,
    },
}, { _id: false });

const ChatSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    id: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Number,
        required: true,
    },
    messages: [MessageSchema],
}, {
    timestamps: true,
});

// Compound index for efficient queries
ChatSessionSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);
