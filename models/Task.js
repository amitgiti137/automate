const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: { type: Number, required: true }, // ✅ Stores userId instead of ObjectId
    assignedTo: [{ type: Number, required: true }], // ✅ Supports multiple assigned users
    category: { type: String, required: true }, // ✅ New: Task category (Department)
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true }, // ✅ New: Task priority
    dueDate: { type: Date, required: true }, // ✅ New: Task due date
    /* attachment: { type: String }, */ // ✅ New: Optional file attachment URL
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
});

if (!global.TaskModel) {
    global.TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
}

module.exports = global.TaskModel;
