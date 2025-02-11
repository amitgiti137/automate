const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: { type: Number, required: true },
    assignedTo: { type: Number, required: true },
    /* category: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    dueDate: { type: Date },
    attachments: [{ type: String }], // File paths (optional) */
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
});

if (!global.TaskModel) {
    global.TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
}

module.exports = global.TaskModel;
