const express = require('express');
const Admin = require('../models/Admin'); // Admin Schema
const Employee = require('../models/Employee'); // Employee Schema
const Task = require('../models/Task'); // Task Schema

const router = express.Router();

// ✅ Function to validate vendorId
const validateVendor = async (vendorId) => {
    if (!vendorId || isNaN(vendorId)) return false;
    const vendorExists = await Admin.findOne({ vendorId });
    return !!vendorExists;
};

// ✅ DELETE Admin and all related Employees & Tasks
router.delete('/delete-admin/:vendorId', async (req, res) => {
    const { vendorId } = req.params;

    try {
        // ✅ Validate vendorId
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        // ✅ Delete all employees under this vendorId
        const deletedEmployees = await Employee.deleteMany({ vendorId });

        // ✅ Delete all tasks associated with this vendorId
        const deletedTasks = await Task.deleteMany({ vendorId });

        // ✅ Delete the admin
        const deletedAdmin = await Admin.findOneAndDelete({ vendorId });

        if (!deletedAdmin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json({
            message: "Admin and all related employees & tasks deleted successfully!",
            vendorId,
            deletedEmployees: deletedEmployees.deletedCount,
            deletedTasks: deletedTasks.deletedCount
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ DELETE Employee and Remove from Assigned Tasks
router.delete('/delete-employee/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        // ✅ Find the employee
        const employee = await Employee.findOne({ employeeId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const vendorId = employee.vendorId;

        // ✅ Delete employee
        await Employee.deleteOne({ employeeId });

        // ✅ Remove employee from all assigned tasks
        const updatedTasks = await Task.updateMany(
            { assignedTo: employeeId },
            { $pull: { assignedTo: employeeId } }
        );

        res.json({
            message: "Employee deleted successfully!",
            vendorId,
            deletedEmployeeId: employeeId,
            tasksUpdated: updatedTasks.modifiedCount
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ DELETE Task by Task ID
router.delete('/delete-task/:taskId', async (req, res) => {
    const { taskId } = req.params;

    try {
        // ✅ Find and delete the task
        const deletedTask = await Task.findOneAndDelete({ _id: taskId });
        if (!deletedTask) return res.status(404).json({ error: "Task not found" });

        res.json({
            message: "Task deleted successfully!",
            deletedTaskId: taskId
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;