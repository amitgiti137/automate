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
            activeStatus: user.activeStatus
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
                activeStatus: user.activeStatus
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
            activeStatus: user.activeStatus
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
        const users = await User.find({}, 'userId vendorId firstName lastName email whatsappNumber role department designation employeeCode activeStatus');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
