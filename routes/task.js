const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User'); // Ensure User model is imported
const router = express.Router();

// Create Task
router.post('/', async (req, res) => {
    const { title, description, assignedBy, assignedTo } = req.body;
    try {
        const task = new Task({ title, description, assignedBy, assignedTo });
        await task.save();
        res.status(201).json({ message: 'Task created successfully!' });
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
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedBy').populate('assignedTo');
        res.json(tasks);
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
