const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: { type: Number, required: true }, // ✅ Stores userId instead of ObjectId
    assignedByName: { type: String },
    assignedTo: [{ type: Number, required: true }], // ✅ Supports multiple assigned users
    assignedToNames: [{ type: String }],
    vendorId: { type: Number, required: true }, // ✅ Stores Vendor ID
    category: { type: String, required: true }, // ✅ New: Task category (Department)
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true }, // ✅ New: Task priority
    dueDate: { type: Date, required: true }, // ✅ New: Task due date
    /* attachment: { type: String }, */ // ✅ New: Optional file attachment URL
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
    updatedAt: { type: Date, default: Date.now } // Track updates
}, {timestamps : true});

if (!global.TaskModel) {
    global.TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
}

module.exports = global.TaskModel;
