const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Employee = require('../models/Employee'); // ✅ Replace User with Employee
const Admin = require('../models/Admin'); // ✅ Validate vendorId
const router = express.Router();

// Function to check valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ Function to validate vendorId
const validateVendor = async (vendorId) => {
    if (!vendorId || isNaN(vendorId)) return false;
    const vendorExists = await Admin.findOne({ vendorId });
    return !!vendorExists;
};

// ✅ Task Creation (with Employee IDs)
router.post('/', async (req, res) => {
    try {
        const { title, description, assignedBy, assignedTo, category, priority, dueDate, vendorId } = req.body;

        // ✅ Validate required fields
        if (!title || !description || !assignedBy || !assignedTo || !category || !priority || !dueDate || !vendorId) {
            return res.status(400).json({ error: "All fields, including vendorId, are required." });
        }

        // ✅ Validate vendorId
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        // ✅ Convert assignedBy & assignedTo to numbers
        const assignedByNumber = Number(assignedBy);
        const assignedToNumbers = Array.isArray(assignedTo) ? assignedTo.map(Number) : [Number(assignedTo)];

        // ✅ Validate assignedBy employee
        const assignedByEmployee = await Employee.findOne({ employeeId: assignedByNumber });
        if (!assignedByEmployee) return res.status(400).json({ error: "AssignedBy employee does not exist" });

        // ✅ Validate assignedTo employees
        const assignedEmployees = await Employee.find({ employeeId: { $in: assignedToNumbers } });
        if (assignedEmployees.length !== assignedToNumbers.length) {
            return res.status(400).json({ error: "One or more assigned employees do not exist" });
        }

        // ✅ Prevent self-assignment
        /* if (assignedToNumbers.includes(assignedByNumber)) {
            return res.status(400).json({ error: "You cannot assign a task to yourself" });
        } */

        // ✅ Create and save task
        const task = new Task({
            title, description, assignedBy: assignedByNumber, assignedTo: assignedToNumbers, category, priority, dueDate, vendorId,
        });

        await task.save();

        res.status(201).json({
            message: "Task created successfully!",
            task: {
                title,
                description,
                category,
                priority,
                dueDate,
                vendorId, // ✅ Include vendorId in response
                assignedBy: `${assignedByEmployee.firstName} ${assignedByEmployee.lastName} (EmployeeID: ${assignedByEmployee.employeeId})`,
                assignedTo: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName} (EmployeeID: ${emp.employeeId})`),
            },
        });

    } catch (err) {
        console.error("Task creation error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Fetch All Tasks for a Specific Vendor
router.get('/vendor/:vendorId', async (req, res) => {
    const { vendorId } = req.params;

    try {
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        const tasks = await Task.find({ vendorId });

        res.json({ vendorId, tasks });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Fetch Tasks Assigned by an Employee in a Specific Vendor
router.get('/assigned-by/:vendorId/:employeeId', async (req, res) => {
    const { vendorId, employeeId } = req.params;

    try {
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        const tasks = await Task.find({ vendorId, assignedBy: employeeId });

        res.json({ vendorId, tasks });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Fetch Tasks Assigned to an Employee in a Specific Vendor
router.get('/assigned-to/:vendorId/:employeeId', async (req, res) => {
    const { vendorId, employeeId } = req.params;

    try {
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        const tasks = await Task.find({ vendorId, assignedTo: employeeId });

        res.json({ vendorId, tasks });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Reassign Task (Ensure it belongs to the correct vendor)
router.put("/reassign/:vendorId/:taskId", async (req, res) => {
    const { vendorId, taskId } = req.params;
    let { newAssignedTo } = req.body;

    try {
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ error: "Invalid Task ID format" });
        }

        if (!Array.isArray(newAssignedTo)) {
            return res.status(400).json({ error: "newAssignedTo must be an array of employee IDs" });
        }

        newAssignedTo = newAssignedTo.flat().map(Number);

        const assignedEmployees = await Employee.find({ employeeId: { $in: newAssignedTo } });
        if (assignedEmployees.length !== newAssignedTo.length) {
            return res.status(404).json({ error: "One or more assigned employees not found" });
        }

        const task = await Task.findOne({ _id: taskId, vendorId });
        if (!task) return res.status(404).json({ error: "Task not found for this vendor" });

        task.assignedTo = newAssignedTo;
        await task.save();

        res.json({ message: "Task reassigned successfully!", vendorId, task });

    } catch (err) {
        console.error("Error reassigning task:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Fetch Task by Task ID (Ensure it belongs to correct vendor)
router.get('/task/:vendorId/:taskId', async (req, res) => {
    const { vendorId, taskId } = req.params;

    try {
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ error: "Invalid Task ID format" });
        }

        const task = await Task.findOne({ _id: taskId, vendorId });
        if (!task) return res.status(404).json({ error: "Task not found for this vendor" });

        res.json({ vendorId, task });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
