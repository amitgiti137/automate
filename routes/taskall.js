const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer'); // ✅ Import Multer
const Task = require('../models/Task');
const Employee = require('../models/Employee'); // ✅ Replace User with Employee
const Admin = require('../models/Admin'); // ✅ Validate vendorId
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Function to check valid ObjectId
/* const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id); */

// ✅ Function to validate vendorId
const validateVendor = async (vendorId) => {
    if (!vendorId || isNaN(vendorId)) return false;
    const vendorExists = await Admin.findOne({ vendorId });
    return !!vendorExists;
};

const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',  // Set time zone to IST
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
});


// ✅ Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// ✅ Ensure file type check works
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    if (allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: JPG, PNG, PDF, DOC, DOCX.'));
    }
};

// ✅ Initialize Multer
const upload = multer({ storage, fileFilter });


// ✅ Task Creation (with Employee IDs)
router.post('/', upload.single('attachment'), async (req, res) => {
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

        // ✅ Handle File Upload
        const attachment = req.file ? req.file.filename : null;

        // ✅ Create and save task
        const task = new Task({
            title, description, assignedBy: assignedByNumber, assignedTo: assignedToNumbers, category, priority, dueDate, vendorId, attachment,
        });

        await task.save();

        res.status(201).json({
            message: "Task created successfully!",
            task: {
                taskId: task.taskId,
                title,
                description,
                category,
                priority,
                dueDate,
                vendorId, // ✅ Include vendorId in response
                status: task.status,
                assignedBy: `(EmployeeID: ${assignedByEmployee.employeeId})`,
                assignedByName:`${assignedByEmployee.firstName} ${assignedByEmployee.lastName}`,
                assignedTo: assignedEmployees.map(emp => `(EmployeeID: ${emp.employeeId})`),
                assignedToNames: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName}`),
                attachment: attachment ? `https://automate-ptg5.onrender.com/uploads/${task.attachment}` : null, // ✅ Return attachment path in response
                createdAt: formatDate(task.createdAt),
                updatedAt: formatDate(task.updatedAt)
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

        // Fetch employee details
        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            const assignedByEmployee = await Employee.findOne({ employeeId: task.assignedBy });
            const assignedEmployees = await Employee.find({ employeeId: { $in: task.assignedTo } });

            return {
                taskId: task.taskId,
                title: task.title,
                description: task.description,
                category: task.category,
                priority: task.priority,
                dueDate: formatDate(task.dueDate),
                vendorId: task.vendorId,
                status: task.status,
                assignedBy: `(EmployeeID: ${assignedByEmployee?.employeeId || "N/A"})`,
                assignedByName: assignedByEmployee ? `${assignedByEmployee.firstName} ${assignedByEmployee.lastName}` : "Unknown",
                assignedTo: assignedEmployees.map(emp => `(EmployeeID: ${emp.employeeId})`),
                assignedToNames: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName}`),
                attachment: task.attachment ? `https://automate-ptg5.onrender.com/uploads/${task.attachment}` : null, // ✅ Return attachment path in response
                createdAt: formatDate(task.createdAt),
                updatedAt: formatDate(task.updatedAt)
            };
        }));

        res.json({ vendorId, tasks: formattedTasks });

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

        // Fetch employee details
        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            const assignedByEmployee = await Employee.findOne({ employeeId: task.assignedBy });
            const assignedEmployees = await Employee.find({ employeeId: { $in: task.assignedTo } });

            return {
                taskId: task.taskId,
                title: task.title,
                description: task.description,
                category: task.category,
                priority: task.priority,
                dueDate: formatDate(task.dueDate),
                vendorId: task.vendorId,
                status: task.status,
                assignedBy: `(EmployeeID: ${assignedByEmployee?.employeeId || "N/A"})`,
                assignedByName: assignedByEmployee ? `${assignedByEmployee.firstName} ${assignedByEmployee.lastName}` : "Unknown",
                assignedTo: assignedEmployees.map(emp => `(EmployeeID: ${emp.employeeId})`),
                assignedToNames: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName}`),
                attachment: task.attachment ? `https://automate-ptg5.onrender.com/uploads/${task.attachment}` : null, // ✅ Return attachment path in response
                createdAt: formatDate(task.createdAt),
                updatedAt: formatDate(task.updatedAt)
            };
        }));

        res.json({ vendorId, tasks: formattedTasks });

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

        // Fetch employee details
        const formattedTasks = await Promise.all(tasks.map(async (task) => {
            const assignedByEmployee = await Employee.findOne({ employeeId: task.assignedBy });
            const assignedEmployees = await Employee.find({ employeeId: { $in: task.assignedTo } });

            return {
                taskId: task.taskId,
                title: task.title,
                description: task.description,
                category: task.category,
                priority: task.priority,
                dueDate: formatDate(task.dueDate),
                vendorId: task.vendorId,
                status: task.status,
                assignedBy: `(EmployeeID: ${assignedByEmployee?.employeeId || "N/A"})`,
                assignedByName: assignedByEmployee ? `${assignedByEmployee.firstName} ${assignedByEmployee.lastName}` : "Unknown",
                assignedTo: assignedEmployees.map(emp => `(EmployeeID: ${emp.employeeId})`),
                assignedToNames: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName}`),
                attachment: task.attachment ? `https://automate-ptg5.onrender.com/uploads/${task.attachment}` : null, // ✅ Return attachment path in response
                createdAt: formatDate(task.createdAt),
                updatedAt: formatDate(task.updatedAt)
            };
        }));

        res.json({ vendorId, tasks: formattedTasks });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Reassign Task (Ensure it belongs to the correct vendor)
router.put("/reassign/:vendorId/:taskId", upload.single('attachment'), async (req, res) => {
    const { vendorId, taskId } = req.params;
    const { role, ...updateFields } = req.body;

    try {
        if (!(await validateVendor(vendorId))) {
            return res.status(400).json({ error: "Invalid Vendor ID." });
        }

        /* if (!isValidObjectId(taskId)) {
            return res.status(400).json({ error: "Invalid Task ID format" });
        } */

        /* if (!Array.isArray(newAssignedTo)) {
            return res.status(400).json({ error: "newAssignedTo must be an array of employee IDs" });
        }

        newAssignedTo = newAssignedTo.flat().map(Number);

        const assignedEmployees = await Employee.find({ employeeId: { $in: newAssignedTo } });
        if (assignedEmployees.length !== newAssignedTo.length) {
            return res.status(404).json({ error: "One or more assigned employees not found" });
        } */

        const task = await Task.findOne({ taskId, vendorId });
        if (!task) return res.status(404).json({ error: "Task not found for this vendor" });

        // ✅ Role Validation: Only Admins can update the due date
        if (updateFields.dueDate && role !== "Admin") {
            return res.status(403).json({ error: "Only Admins can update the due date." });
        }

        // ✅ Remove old file if a new one is uploaded
        if (req.file) {
            if (task.attachment && fs.existsSync(task.attachment)) {
                fs.unlinkSync(task.attachment);
            }
            task.attachment = req.file.filename;
        }

        // ✅ Allow Updating Status
        if (updateFields.status) {
            const validStatuses = ["Pending", "In-Progress", "Completed"];
            if (!validStatuses.includes(updateFields.status)) {
                return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(", ")}` });
            }
            task.status = updateFields.status;
        }

        // Handle `assignedTo` field separately
        if (updateFields.assignedTo) {
            if (!Array.isArray(updateFields.assignedTo)) {
                return res.status(400).json({ error: "assignedTo must be an array of employee IDs" });
            }
            const newAssignedTo = updateFields.assignedTo.flat().map(Number);
            const assignedEmployees = await Employee.find({ employeeId: { $in: newAssignedTo } });

            if (assignedEmployees.length !== newAssignedTo.length) {
                return res.status(404).json({ error: "One or more assigned employees not found" });
            }

            task.assignedTo = newAssignedTo;
        }

        // Update only provided fields (skip undefined fields)
        for (const key in updateFields) {
            if (key !== "assignedTo" && updateFields[key] !== undefined) {
                task[key] = updateFields[key];
            }
        }

        task.updatedAt = new Date(); // Update timestamp
        await task.save();

        // Fetch employee details for response
        const assignedByEmployee = await Employee.findOne({ employeeId: task.assignedBy });
        const assignedEmployees = await Employee.find({ employeeId: { $in: task.assignedTo } });

        // Format Response
        const formattedTask = {
            taskId: task.taskId,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            dueDate: formatDate(task.dueDate),
            vendorId: task.vendorId,
            status: task.status,
            assignedBy: `(EmployeeID: ${assignedByEmployee?.employeeId || "N/A"})`,
            assignedByName: assignedByEmployee ? `${assignedByEmployee.firstName} ${assignedByEmployee.lastName}` : "Unknown",
            assignedTo: assignedEmployees.map(emp => `(EmployeeID: ${emp.employeeId})`),
            assignedToNames: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName}`),
            attachment: task.attachment ? `https://automate-ptg5.onrender.com/uploads/${task.attachment}` : null, // ✅ Return attachment path in response
            createdAt: formatDate(task.createdAt),
            updatedAt: formatDate(task.updatedAt)
        };

        res.json({ message: "Task reassigned successfully!", vendorId, task: formattedTask });

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

        /* if (!isValidObjectId(taskId)) {
            return res.status(400).json({ error: "Invalid Task ID format" });
        } */

        const task = await Task.findOne({ taskId, vendorId });
        if (!task) return res.status(404).json({ error: "Task not found for this vendor" });

        // Fetch employee details
        const assignedByEmployee = await Employee.findOne({ employeeId: task.assignedBy });
        const assignedEmployees = await Employee.find({ employeeId: { $in: task.assignedTo } });

        // Format the response
        const formattedTask = {
            taskId: task.taskId,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            dueDate: formatDate(task.dueDate),
            vendorId: task.vendorId,
            status: task.status,
            assignedBy: `(EmployeeID: ${assignedByEmployee?.employeeId || "N/A"})`,
            assignedByName: assignedByEmployee ? `${assignedByEmployee.firstName} ${assignedByEmployee.lastName}` : "Unknown",
            assignedTo: assignedEmployees.map(emp => `(EmployeeID: ${emp.employeeId})`),
            assignedToNames: assignedEmployees.map(emp => `${emp.firstName} ${emp.lastName}`),
            attachment: task.attachment ? `https://automate-ptg5.onrender.com/uploads/${task.attachment}` : null, // ✅ Return attachment path in response
            createdAt: formatDate(task.createdAt),
            updatedAt: formatDate(task.updatedAt)
        };

        res.json({ vendorId, task: formattedTask });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
