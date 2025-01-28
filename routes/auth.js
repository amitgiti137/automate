const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;
    try {
        const user = new User({ name, email, password, phoneNumber });
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        /* const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' }); */
        if (password !== user.password) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get User Details by Email
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
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
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

// Fetch All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name email phoneNumber role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
