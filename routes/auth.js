const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// **Register User**
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        // Check if email or phone number already exists
        const existingUser = await User.findOne({ $or: [{ email }, { whatsappNumber }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or WhatsApp number already exists' });
        }

        // Get the last userId from the database and increment
        const lastUser = await User.findOne().sort({ userId: -1 });
        const newUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 100001;

        // Create new user with sequential userId and fixed vendorId
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            whatsappNumber,
            userId: newUserId, // Assign userId manually
            department,
            designation,
            employeeCode,
            activeStatus
        });

        await user.save();

        // Format the dates
        const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',  // Set time zone to IST
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        res.status(201).json({
            message: 'User registered successfully!',
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
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// **Login User**
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Compare hashed password
        if (password !== user.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Format the dates
        const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',  // Set time zone to IST
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        res.json({
            token,
            userId: user.userId,
            vendorId: user.vendorId,
            user: {
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
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.put('/update_user', async (req, res) => {
    const { email, newEmail, ...updates } = req.body;

    if (!email) {
        return res.status(400).json({ status: false, message: 'Email is required to update user details' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
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
                userId: user.userId,
                vendorId: user.vendorId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email, // Updated email
                whatsappNumber: user.whatsappNumber,
                role: user.role,
                department: user.department,
                designation: user.designation,
                employeeCode: user.employeeCode,
                activeStatus: user.activeStatus,
                createdAt: formatDate(user.createdAt),
                updatedAt: formatDate(user.updatedAt) // Updated timestamp
            }
        });
    } catch (err) {
        res.status(500).json({ status: false, message: 'Internal server error', error: err.message });
    }
});




// **Get User Details by Email**
router.get('/user_details', async (req, res) => {
    const { email } = req.query;

    try {
        if (!email) {
            return res.status(400).json({ status: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        // Format the dates
        const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',  // Set time zone to IST
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        const responseData = {
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
        };

        res.json({
            status: true,
            message: 'User details fetched successfully',
            data: responseData,
        });
    } catch (err) {
        res.status(500).json({ status: false, message: 'Internal server error', error: err.message });
    }
});

// **Fetch All Users**
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'userId vendorId firstName lastName email whatsappNumber role department designation employeeCode activeStatus createdAt updatedAt');

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
