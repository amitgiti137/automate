const express = require('express');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Format the dates
const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',  // Set time zone to IST
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
});

// **Admin Registration**
router.post('/register_admin', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const admin = new Admin({
            firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus,
            
        });

        await admin.save();

        // Generate first employeeId for this vendor
        const employeeId = admin.employeeId;

        // Create employee entry for the admin
        const employee = new Employee({
            firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus,
            vendorId: admin.vendorId,
            employeeId: admin.employeeId
            
        });

        await employee.save();


        res.status(201).json({
            message: 'Admin registered successfully!',
            admin: {
                ...admin.toObject(),
                createdAt: formatDate(admin.createdAt),
                updatedAt: formatDate(admin.updatedAt)
            },
            employee: {
                ...employee.toObject(),
                createdAt: formatDate(employee.createdAt),
                updatedAt: formatDate(employee.updatedAt)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Employee Registration**
router.post('/register_employee', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, whatsappNumber, department, designation, employeeCode, activeStatus, vendorId, role } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus || !vendorId ||!role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const adminExists = await Admin.findOne({ vendorId });
        if (!adminExists) {
            return res.status(400).json({ error: 'Invalid Vendor ID. No admin found with this Vendor ID' });
        }

        // ✅ Step 2: Validate that the requesting user has "Admin" role
        if (role !== "Employee") {
            return res.status(400).json({ error: 'Invalid role. Only "Admin" role can be assigned.' });
        }

        const employee = new Employee({
            firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus, vendorId
        });

        await employee.save();

        res.status(201).json({
            message: 'Employee registered successfully!',
            employee: {
                ...employee.toObject(),
                createdAt: formatDate(employee.createdAt),
                updatedAt: formatDate(employee.updatedAt)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Login**
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await Admin.findOne({ email }) || await Employee.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (password !== user.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // ✅ Fetch employeeId from Admin model if the user is an Admin
        /* let employeeId = user.employeeId;
        if (user instanceof Admin) {
            const employee = await Employee.findOne({ email, vendorId: user.vendorId });
            if (employee) {
                employeeId = employee.employeeId;
            }
        } */

        const token = jwt.sign({ id: user._id, vendorId: user.vendorId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                ...user.toObject(),
                createdAt: formatDate(user.createdAt),
                updatedAt: formatDate(user.updatedAt)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/update_employee', async (req, res) => {
    const { email, newEmail, vendorId, ...updates } = req.body;

    if (!email || !vendorId) {
        return res.status(400).json({ status: false, message: 'Email and Vendor ID are required' });
    }

    try {

        const adminExists = await Admin.findOne({ vendorId });
        if (!adminExists) {
            return res.status(400).json({ status: false, message: 'Invalid Vendor ID. No admin found with this Vendor ID' });
        }

        const user = await Employee.findOne({ email, vendorId });

        if (!user) {
            return res.status(404).json({ status: false, message: 'Employee not found' });
        }

        // If user wants to update email, check if the new email already exists
        if (newEmail && newEmail !== email) {
            const existingEmail = await Employee.findOne({ email: newEmail });
            if (existingEmail) {
                return res.status(400).json({ status: false, message: 'New email already in use' });
            }
            user.email = newEmail; // Update email
        }

        // Only update the fields provided in the request
        Object.keys(updates).forEach((key) => {
            if (updates[key] !== undefined) {
                user[key] = updates[key];
            }
        });

        await user.save();

        // Format the dates
        const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',  // Set time zone to IST
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        res.json({
            status: true,
            message: 'User details updated successfully',
            user: {
                ...user.toObject(),
                createdAt: formatDate(user.createdAt),
                updatedAt: formatDate(user.updatedAt)
            }
        });
    } catch (err) {
        res.status(500).json({ status: false, message: 'Internal server error', error: err.message });
    }
});




// **Get User Details by Email**
router.get('/employee_details', async (req, res) => {
    const { email, vendorId } = req.query;

    if (!email || !vendorId) {
        return res.status(400).json({ status: false, message: 'Email and Vendor ID are required' });
    }

    try {
        /* const adminExists = await Admin.findOne({ vendorId });
        if (!adminExists) {
            return res.status(400).json({ status: false, message: 'Invalid Vendor ID. No admin found with this Vendor ID' });
        } */

        const user = await Employee.findOne({ email, vendorId });

        // Format the dates
        const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',  // Set time zone to IST
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        if (!user) {
            return res.status(404).json({ status: false, message: 'Employee not found' });
        }



        res.json({
            status: true,
            message: 'Employee details fetched successfully',
            user: {
                ...user.toObject(),
                createdAt: formatDate(user.createdAt),
                updatedAt: formatDate(user.updatedAt)
            }
        });
    } catch (err) {
        res.status(500).json({ status: false, message: 'Internal server error', error: err.message });
    }
});

// **Fetch All Users**
router.get('/employees', async (req, res) => {
    const { vendorId } = req.query;

    if (!vendorId) {
        return res.status(400).json({ status: false, message: 'Vendor ID is required' });
    }
    try {

        /* const adminExists = await Admin.findOne({ vendorId });
        if (!adminExists) {
            return res.status(400).json({ status: false, message: 'Invalid Vendor ID. No admin found with this Vendor ID' });
        } */

        const users = await Employee.find({ vendorId }, 'employeeId vendorId firstName lastName email whatsappNumber department designation employeeCode activeStatus createdAt updatedAt');
        `    `

        if (users.length === 0) {
            return res.status(404).json({ status: false, message: 'No employees found under this Vendor ID' });
        }
        

        // Format createdAt & updatedAt for each user
        const formattedUsers = users.map(user => ({
            employeeId: user.employeeId,
            vendorId: user.vendorId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            whatsappNumber: user.whatsappNumber,
            department: user.department,
            designation: user.designation,
            employeeCode: user.employeeCode,
            activeStatus: user.activeStatus,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt)
        }));

        res.json({
            status: true,
            message: 'Employees fetched successfully',
            employees: formattedUsers
        });
    } catch (err) {
        a
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
