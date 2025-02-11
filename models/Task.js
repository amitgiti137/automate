const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: { type: Number, required: true }, // UserID of the person assigning the task
    assignedTo: [{ type: Number, required: true }], // Array of userIds
    category: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    dueDate: { type: Date },
    attachments: [{ type: String }], // File paths (optional)
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

if (!global.TaskModel) {
    global.TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
}

module.exports = global.TaskModel;
