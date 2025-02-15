const express = require('express');
/* const multer = require('multer'); */
const mongoose = require('mongoose'); // Ensure mongoose is imported
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
        // ✅ Validate taskId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: "Invalid Task ID format" });
        }

        // ✅ Ensure `newAssignedTo` is always a number (UserID)
        if (!Array.isArray(newAssignedTo)) {
            newAssignedTo = [newAssignedTo]; // Convert single value to array
        }
        newAssignedTo = newAssignedTo.map(Number); // Ensure all values are numbers

        // ✅ Ensure the new assigned user exists
        const assignedUsers = await User.find({ userId: { $in: newAssignedTo } }, 'userId firstName lastName');
        if (assignedUsers.length !== newAssignedTo.length) {
            return res.status(400).json({ error: "One or more assigned users do not exist" });
        }

        // ✅ Fetch the task and validate existence
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // ✅ Prevent assigning the same user again
        if (task.assignedTo.includes(newAssignedTo)) {
            return res.status(400).json({ error: "Task is already assigned to this user" });
        }

        // ✅ Prevent assigning task to the same user who created it
        if (task.assignedBy === newAssignedTo) {
            return res.status(400).json({ error: "You cannot assign a task to yourself" });
        }

        // ✅ Update the task with the new assignee
        task.assignedTo = [newAssignedTo]; // Reassign to the new user
        await task.save();

        // ✅ Fetch assignedBy user details
        const assignedByUser = await User.findOne({ userId: task.assignedBy }, 'firstName lastName userId');

        // ✅ Fetch new assignedTo user details
        const assignedToUser = await User.findOne({ userId: newAssignedTo }, 'firstName lastName userId');

        // ✅ Format the response
        res.json({
            message: 'Task reassigned successfully!',
            task: {
                title: task.title,
                description: task.description,
                assignedBy: assignedByUser
                    ? { userId: assignedByUser.userId, name: `${assignedByUser.firstName} ${assignedByUser.lastName}` }
                    : { userId: null, name: "Unknown" },
                assignedTo: assignedToUser
                    ? { userId: assignedToUser.userId, name: `${assignedToUser.firstName} ${assignedToUser.lastName}` }
                    : { userId: null, name: "Unknown" },
                status: task.status,
                createdAt: task.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
            }
        });

    } catch (err) {
        console.error("Error reassigning task:", err);
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
/* router.get('/:userId', async (req, res) => {
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
}); */

router.get('/assigned-by/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find all tasks where the user is the one who assigned the task
        const tasks = await Task.find({ assignedBy: userId });

        if (!tasks.length) {
            return res.status(404).json({ error: "No tasks found assigned by this user" });
        }

        // Format response
        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            const assignedToUsers = await User.find({ userId: { $in: task.assignedTo } }, 'firstName lastName userId');

            return {
                _id: task._id,
                title: task.title,
                description: task.description,
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

router.get('/assigned-to/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find tasks assigned to this user
        const tasks = await Task.find({ assignedTo: userId });

        if (!tasks.length) {
            return res.status(404).json({ error: "No tasks found assigned to this user" });
        }

        // Format response
        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            const assignedByUser = await User.findOne({ userId: task.assignedBy }, 'firstName lastName userId');

            return {
                _id: task._id,
                title: task.title,
                description: task.description,
                assignedBy: assignedByUser
                    ? { userId: assignedByUser.userId, name: `${assignedByUser.firstName} ${assignedByUser.lastName}` }
                    : { userId: null, name: "Unknown" },
                status: task.status,
                createdAt: task.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
            };
        }));

        res.json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/task/:taskId', async (req, res) => {
    const { taskId } = req.params;

    try {
        // ✅ Fix: Convert `taskId` to a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: "Invalid Task ID format" });
        }

        // ✅ Fetch the task by ID
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // ✅ Fetch assignedBy user details
        const assignedByUser = await User.findOne({ userId: task.assignedBy.toString() }, 'firstName lastName userId');

        // ✅ Fetch assignedTo user details (if multiple, return array)
        const assignedToUsers = await User.find({ userId: { $in: task.assignedTo.map(String) } }, 'firstName lastName userId');

        // ✅ Format the response
        const formattedTask = {
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

        res.json(formattedTask);
    } catch (err) {
        console.error("Error fetching task by ID:", err);
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
