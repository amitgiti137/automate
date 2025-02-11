const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User'); // Ensure User model is imported
const router = express.Router();

// Create Task
router.post('/', async (req, res) => {
    const { title, description, assignedBy, assignedTo } = req.body;
    try {
        // ✅ Validate assignedBy user exists
        const assignedByUser = await User.findOne({ userId: assignedBy });
        if (!assignedByUser) {
            return res.status(400).json({ error: 'AssignedBy user does not exist' });
        }

        // ✅ Validate assignedTo users exist
        const assignedUsers = await User.find({ userId: { $in: assignedTo } });
        if (assignedUsers.length !== assignedTo.length) {
            return res.status(400).json({ error: 'One or more assigned users do not exist' });
        }

        // ✅ Prevent self-assignment
        if (assignedTo.includes(assignedBy)) {
            return res.status(400).json({ error: 'You cannot assign a task to yourself' });
        }

        // ✅ Create task (Stores only `userId`)
        const task = new Task({ title, description, assignedBy, assignedTo });
        await task.save();

        res.status(201).json({ 
            message: 'Task created successfully!',
            task: {
                title,
                description,
                assignedBy: `${assignedByUser.firstName} ${assignedByUser.lastName} (UserID: ${assignedByUser.userId})`,
                assignedTo: assignedUsers.map(user => `${user.firstName} ${user.lastName} (UserID: ${user.userId})`)
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
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find();

        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            // Fetch assignedBy user details
            const assignedByUser = await User.findOne({ userId: task.assignedBy }, 'firstName lastName userId');

            // Fetch assignedTo user details
            const assignedToUsers = await User.find({ userId: { $in: task.assignedTo } }, 'firstName lastName userId');

            return {
                title: task.title,
                description: task.description,
                assignedBy: assignedByUser 
                    ? `${assignedByUser.firstName} ${assignedByUser.lastName} (UserID: ${assignedByUser.userId})`
                    : "Unknown",
                assignedTo: assignedToUsers.map(user => `${user.firstName} ${user.lastName} (UserID: ${user.userId})`),
                createdAt: task.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
            };
        }));

        res.json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch Tasks for a User
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const tasks = await Task.find({ assignedTo: userId });

        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            // Fetch assignedBy user details
            const assignedByUser = await User.findOne({ userId: task.assignedBy }, 'firstName lastName userId');

            // Fetch assignedTo user details
            const assignedToUsers = await User.find({ userId: { $in: task.assignedTo } }, 'firstName lastName userId');

            return {
                title: task.title,
                description: task.description,
                assignedBy: assignedByUser 
                    ? `${assignedByUser.firstName} ${assignedByUser.lastName} (UserID: ${assignedByUser.userId})`
                    : "Unknown",
                assignedTo: assignedToUsers.map(user => `${user.firstName} ${user.lastName} (UserID: ${user.userId})`),
                createdAt: task.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
            };
        }));

        res.json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
