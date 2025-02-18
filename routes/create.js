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
            firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus
        });

        await admin.save();

        // Generate first employeeId for this vendor
        const employeeId = admin.vendorId * 10000 + 1;

        // Create employee entry for the admin
        const employee = new Employee({
            firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus,
            vendorId: admin.vendorId,
            employeeId
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
    const { firstName, lastName, email, password, confirmPassword, whatsappNumber, department, designation, employeeCode, activeStatus, vendorId } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus || !vendorId) {
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

        const token = jwt.sign({ id: user._id, vendorId: user.vendorId }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
    const { email, newEmail, ...updates } = req.body;

    if (!email) {
        return res.status(400).json({ status: false, message: 'Email is required to update user details' });
    }

    try {
        const user = await Employee.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: false, message: 'Employee not found' });
        }

        // If user wants to update email, check if the new email already exists
        if (newEmail && newEmail !== email) {
            const existingEmail = await User.findOne({ email: newEmail });
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
    const { email } = req.query;

    try {
        if (!email) {
            return res.status(400).json({ status: false, message: 'Email is required' });
        }

        const user = await Employee.findOne({ email });

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

// **Fetch All Users**
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'userId vendorId firstName lastName email whatsappNumber role department designation employeeCode activeStatus createdAt updatedAt');
`    `
        // Function to format date
        const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',  // Set time zone to IST
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        // Format createdAt & updatedAt for each user
        const formattedUsers = users.map(user => ({
            userId: user.userId,
            vendorId: user.vendorId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            whatsappNumber: user.whatsappNumber,
            role: user.role,
            department: user.department,
            designation: user.designation,
            employeeCode: user.employeeCode,
            activeStatus: user.activeStatus,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt)
        }));

        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
