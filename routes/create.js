const express = require('express');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

        res.status(201).json({
            message: 'Admin registered successfully!',
            ...admin.toObject() 
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
            ...employee.toObject() 
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

        res.json({ token, ...user.toObject() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
