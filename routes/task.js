const express = require('express');
const multer = require('multer');
const Task = require('../models/Task');
const User = require('../models/User'); // Ensure User model is imported
const router = express.Router();
const { verifyToken } = require('../middleware/auth'); // Middleware for authentication

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

// Format date to IST
const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
});

// Create Task
/* router.post('/', async (req, res) => {
    const { title, description, assignedBy, assignedTo } = req.body;
    try {
        const task = new Task({ title, description, assignedBy, assignedTo });
        await task.save();
        res.status(201).json({ message: 'Task created successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}); */

// ✅ **Create Task**
router.post('/', verifyToken, upload.array('attachments'), async (req, res) => {
    const { title, description, assignedTo, category, priority, dueDate } = req.body;
    const assignedBy = req.user.userId; // Auto-assign from logged-in user

    try {
        if (!title || !description || !assignedTo || !category || !priority) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let assignedToArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

        // Prevent self-assignment
        if (assignedToArray.includes(assignedBy.toString())) {
            return res.status(400).json({ error: 'You cannot assign a task to yourself' });
        }

        // Validate assigned users exist
        const assignedUsers = await User.find({ userId: { $in: assignedToArray } });
        if (assignedUsers.length !== assignedToArray.length) {
            return res.status(400).json({ error: 'One or more assigned users do not exist' });
        }

        const filePaths = req.files ? req.files.map(file => file.path) : [];

        const newTask = new Task({
            title,
            description,
            assignedBy,
            assignedTo: assignedToArray,
            category,
            priority,
            dueDate,
            attachments: filePaths
        });

        await newTask.save();

        res.status(201).json({
            message: 'Task assigned successfully!',
            task: {
                title: newTask.title,
                description: newTask.description,
                assignedBy,
                assignedTo,
                category,
                priority,
                dueDate: formatDate(newTask.dueDate),
                createdAt: formatDate(newTask.createdAt),
                attachments: newTask.attachments,
                status: newTask.status
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reassign Task
router.put('/reassign/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { newAssignedTo } = req.body;

    try {
        // Ensure the new assigned user exists
        const newAssignee = await User.findById(newAssignedTo);
        if (!newAssignee) {
            return res.status(404).json({ error: 'New assignee not found' });
        }

        // Update the task with the new assignee
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { assignedTo: newAssignedTo },
            { new: true }
        ).populate('assignedBy').populate('assignedTo');

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            message: 'Task reassigned successfully!',
            task: updatedTask,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch All Tasks
/* router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedBy').populate('assignedTo');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}); */
router.get('/', verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate({ path: 'assignedBy', select: 'userId firstName lastName email' })
            .populate({ path: 'assignedTo', select: 'userId firstName lastName email' });

        res.json(tasks.map(task => ({
            title: task.title,
            description: task.description,
            assignedBy: `${task.assignedBy.firstName} ${task.assignedBy.lastName} (UserID: ${task.assignedBy.userId})`,
            assignedTo: task.assignedTo.map(user => `${user.firstName} ${user.lastName} (UserID: ${user.userId})`),
            category: task.category,
            priority: task.priority,
            dueDate: formatDate(task.dueDate),
            createdAt: formatDate(task.createdAt),
            status: task.status
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch Tasks for a User
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const tasks = await Task.find({ assignedTo: userId }).populate('assignedBy').populate('assignedTo');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
