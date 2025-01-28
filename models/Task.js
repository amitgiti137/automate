const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
});

if (!global.TaskModel) {
    global.TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
}

module.exports = global.TaskModel;
