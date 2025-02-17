const express = require('express');
const Admin = require('../models/Admin');  // Separate Admin model
const Employee = require('../models/Employee');  // Employee model
const jwt = require('jsonwebtoken');
const router = express.Router();

const START_ADMIN_ID = 10001;
const START_VENDOR_ID = 10001;
const START_EMPLOYEE_ID = 100001;

// **Admin Registration**
router.post('/register-admin', async (req, res) => {
    const { firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin email already exists' });
        }

        const lastAdmin = await Admin.findOne().sort({ userId: -1 });
        const newAdminId = lastAdmin ? lastAdmin.userId + 1 : START_ADMIN_ID;

        const lastVendor = await Admin.findOne().sort({ vendorId: -1 });
        const newVendorId = lastVendor ? lastVendor.vendorId + 1 : START_VENDOR_ID;

        const admin = new Admin({
            userId: newAdminId,
            vendorId: newVendorId,
            firstName,
            lastName,
            email,
            password,  // Password is stored as plain text
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus,
            role: 'admin'
        });

        await admin.save();

        res.status(201).json({
            message: 'Admin registered successfully!',
            userId: admin.userId,
            vendorId: admin.vendorId,
            email: admin.email,
            role: admin.role
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Admin Login**
router.post('/login-admin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (password !== admin.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, admin });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Register Employee (Under Admin's Vendor ID)**
router.post('/register-employee', async (req, res) => {
    const { vendorId, firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!vendorId || !firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const admin = await Admin.findOne({ vendorId });
        if (!admin) {
            return res.status(400).json({ error: 'Invalid vendorId. Admin not found.' });
        }

        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ error: 'Employee email already exists' });
        }

        const lastEmployee = await Employee.findOne().sort({ userId: -1 });
        const newEmployeeId = lastEmployee ? lastEmployee.userId + 1 : START_EMPLOYEE_ID;

        const employee = new Employee({
            userId: newEmployeeId,
            vendorId,  // Assigning Admin's vendor ID to employee
            firstName,
            lastName,
            email,
            password,  // Password is stored as plain text
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus,
            role: 'employee'
        });

        await employee.save();

        res.status(201).json({
            message: 'Employee registered successfully!',
            userId: employee.userId,
            vendorId: employee.vendorId,
            email: employee.email,
            role: employee.role
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Update Employee Details**
router.put('/update-employee', async (req, res) => {
    const { email, updates } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        Object.keys(updates).forEach((key) => {
            if (updates[key] !== undefined) {
                employee[key] = updates[key];
            }
        });

        await employee.save();

        res.json({ message: 'Employee updated successfully!', employee });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Get Employee Details by Email**
router.get('/employee-details', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ employee });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Fetch All Employees for an Admin (Using Vendor ID)**
router.get('/employees', async (req, res) => {
    const { vendorId } = req.query;

    if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' });
    }

    try {
        const admin = await Admin.findOne({ vendorId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const employees = await Employee.find({ vendorId });

        res.json({ employees });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
