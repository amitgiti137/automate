const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    taskId: { type: String, unique: true },
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
    attachment: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // ✅ Store GridFS File ID
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
    updatedAt: { type: Date, default: Date.now } // Track updates
}, {timestamps : true});

// ✅ Function to generate custom Task ID (T[VendorId]00001)
const generateTaskId = async function (vendorId) {
    const lastTask = await this.constructor.findOne({ vendorId }).sort({ createdAt: -1 });

    let lastNumber = 0;
    if (lastTask && lastTask.taskId) {
        lastNumber = parseInt(lastTask.taskId.substring(2)); // Extract number part
    }

    return `T${vendorId}${(lastNumber + 1).toString().padStart(5, "0")}`;
};

// ✅ Generate Task ID Before Saving
TaskSchema.pre('save', async function (next) {
    if (!this.taskId) {
        this.taskId = await generateTaskId.call(this, this.vendorId);
    }
    next();
});

if (!global.TaskModel) {
    global.TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
}

module.exports = global.TaskModel;
