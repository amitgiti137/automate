const express = require('express');
/* const multer = require('multer'); */
const Task = require('../models/Task');
const User = require('../models/User'); // Ensure User model is imported
const router = express.Router();

// Multer Storage Configuration for File Upload
/* const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage: storage }); */

// Create Task
router.post('/', async (req, res) => {
    try {
        // ✅ Fix: Ensure `assignedBy` is a Number
        const assignedBy = Number(req.body.assignedBy);

        // ✅ Fix: Ensure `assignedTo` is an array of numbers
        const assignedTo = Array.isArray(req.body.assignedTo) 
            ? req.body.assignedTo.map(Number) 
            : [Number(req.body.assignedTo)]; // Convert single value to array

        console.log("Received Payload:", req.body); // ✅ Debugging
        console.log("Assigned To:", assignedTo); // ✅ Debugging

        // ✅ Validate assignedBy user exists
        const assignedByUser = await User.findOne({ userId: assignedBy });
        if (!assignedByUser) {
            return res.status(400).json({ error: "AssignedBy user does not exist" });
        }

        // ✅ Validate assignedTo users exist
        const assignedUsers = await User.find({ userId: { $in: assignedTo } });
        if (assignedUsers.length !== assignedTo.length) {
            return res.status(400).json({ error: "One or more assigned users do not exist" });
        }

        // ✅ Prevent self-assignment
        if (assignedTo.includes(assignedBy)) {
            return res.status(400).json({ error: "You cannot assign a task to yourself" });
        }

        // ✅ Validate priority
        const validPriorities = ["high", "medium", "low"];
        if (!validPriorities.includes(req.body.priority)) {
            return res.status(400).json({ error: "Invalid priority value" });
        }

        // ✅ Validate category
        const validCategories = ["HR", "IT", "Finance", "Marketing", "Sales"];
        if (!validCategories.includes(req.body.category)) {
            return res.status(400).json({ error: "Invalid category" });
        }

        // ✅ Validate Due Date
        if (!req.body.dueDate || isNaN(new Date(req.body.dueDate).getTime())) {
            return res.status(400).json({ error: "Invalid or missing due date" });
        }

        // ✅ Create task
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            assignedBy,
            assignedTo,
            category: req.body.category,
            priority: req.body.priority,
            dueDate: new Date(req.body.dueDate),
        });

        await task.save();

        res.status(201).json({
            message: "Task created successfully!",
            task: {
                title: task.title,
                description: task.description,
                category: task.category,
                priority: task.priority,
                dueDate: task.dueDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
                assignedBy: `${assignedByUser.firstName} ${assignedByUser.lastName} (UserID: ${assignedByUser.userId})`,
                assignedTo: assignedUsers.map(user => `${user.firstName} ${user.lastName} (UserID: ${user.userId})`)
            }
        });

    } catch (err) {
        console.error("Task creation error:", err);
        res.status(500).json({ error: err.message });
    }
});


// Reassign Task
router.put('/reassign/:taskId', async (req, res) => {
    const { taskId } = req.params;
    let { newAssignedTo } = req.body;

    try {

        // ✅ Ensure newAssignedTo is always an array and extract the first value
        if (Array.isArray(newAssignedTo)) {
            newAssignedTo = newAssignedTo[0]; // Extract first value
        }

        // Ensure the new assigned user exists
        const newAssignee = await User.findById({ userId: Number(newAssignedTo) });
        if (!newAssignee) {
            return res.status(404).json({ error: 'New assignee not found' });
        }

        // Update the task with the new assignee
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { assignedTo: Number(newAssignedTo) },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // ✅ Convert assignedBy and assignedTo userIds to names for the response
        const assignedByUser = await User.findOne({ userId: Number(updatedTask.assignedBy) }, 'firstName lastName');
        const assignedToUser = await User.findOne({ userId: Number(updatedTask.assignedTo) }, 'firstName lastName');

        res.json({
            message: 'Task reassigned successfully!',
            task: {
                title: updatedTask.title,
                description: updatedTask.description,
                assignedBy: assignedByUser
                    ? `${assignedByUser.firstName} ${assignedByUser.lastName}`
                    : "Unknown",
                assignedTo: assignedToUser
                    ? `${assignedToUser.firstName} ${assignedToUser.lastName}`
                    : "Unknown",
                createdAt: updatedTask.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
            }
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
                _id: task._id,
                title: task.title,
                description: task.description,
                assignedBy: assignedByUser
                    ? { userId: assignedByUser.userId, name: `${assignedByUser.firstName} ${assignedByUser.lastName}` }
                    : { userId: null, name: "Unknown" },
                assignedTo: assignedToUsers.length > 0
                    ? assignedToUsers.map(user => ({ userId: user.userId, name: `${user.firstName} ${user.lastName}` }))
                    : [{ userId: null, name: "Unknown" }],
                status: task.status,
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
                _id: task._id,
                title: task.title,
                description: task.description,
                assignedBy: assignedByUser
                    ? { userId: assignedByUser.userId, name: `${assignedByUser.firstName} ${assignedByUser.lastName}` }
                    : { userId: null, name: "Unknown" },
                assignedTo: assignedToUsers.length > 0
                    ? assignedToUsers.map(user => ({ userId: user.userId, name: `${user.firstName} ${user.lastName}` }))
                    : [{ userId: null, name: "Unknown" }],
                status: task.status,
                createdAt: task.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
            };
        }));

        res.json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
