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

// ✅ Middleware: Verify Admin Role Before Deleting
const verifyAdminRole = async (req, res, next) => {
    const { vendorId, role } = req.body;

    if (!vendorId || !role) {
        return res.status(400).json({ error: "Vendor ID and Role are required." });
    }

    // ✅ Check if vendorId belongs to an actual Admin
    const adminUser = await Admin.findOne({ vendorId });

    if (!adminUser || role !== "Admin" || adminUser.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized. Only an Admin can perform this action." });
    }

    next(); // ✅ Proceed to the next function
};



// ✅ DELETE Admin and all related Employees & Tasks
router.delete('/delete-admin/:vendorId/:role', verifyAdminRole, async (req, res) => {
    const { vendorId, role } = req.params;

    try {

        // ✅ Validate role from URL
        if (role !== "Admin") {
            return res.status(403).json({ error: "Not authorized. Only an Admin can delete an admin." });
        }

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

// ✅ DELETE Employee (Requires vendorId for Security)
router.delete('/delete-employee/:vendorId/:employeeId/:role', async (req, res) => {
    const { vendorId, employeeId, role } = req.params;

    try {
        // ✅ Validate role from URL
        if (role !== "Admin") {
            return res.status(403).json({ error: "Not authorized. Only an Admin can delete an admin." });
        }

        // ✅ Validate vendorId
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        // ✅ Find employee with matching vendorId
        const employee = await Employee.findOne({ vendorId, employeeId });
        if (!employee) return res.status(404).json({ error: "Employee not found for this vendor." });

        // ✅ Delete employee
        await Employee.deleteOne({ vendorId, employeeId });

        // ✅ Remove employee from all assigned tasks
        const updatedTasks = await Task.updateMany(
            { vendorId, assignedTo: employeeId },
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

// ✅ DELETE Task (Requires vendorId for Security)
router.delete('/delete-task/:vendorId/:taskId/:role', async (req, res) => {
    const { vendorId, taskId, role } = req.params;

    try {
        // ✅ Validate role from URL
        if (role !== "Admin") {
            return res.status(403).json({ error: "Not authorized. Only an Admin can delete an admin." });
        }

        // ✅ Validate vendorId
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        // ✅ Find and delete the task with matching vendorId
        const deletedTask = await Task.findOneAndDelete({ vendorId, taskId });
        if (!deletedTask) return res.status(404).json({ error: "Task not found for this vendor." });

        res.json({
            message: "Task deleted successfully!",
            vendorId,
            deletedTaskId: taskId
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
