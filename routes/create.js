const express = require('express');
const AdminModel = require('../models/Admin');
const EmployeeModel = require('../models/Employee');
const router = express.Router();

// **Register Admin**
router.post('/register-admin', async (req, res) => {
    const { firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // AdminModel will handle vendorId and employeeId generation
        const newAdmin = new (AdminModel("admins"))({
            firstName,
            lastName,
            email,
            password,
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus
        });

        await newAdmin.save();

        res.status(201).json({
            message: 'Admin registered successfully!',
            collection: `admin${newAdmin.vendorId}`,
            vendorId: newAdmin.vendorId,
            employeeId: newAdmin.employeeId,
            email: newAdmin.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Register Employee**
router.post('/register-employee', async (req, res) => {
    const { vendorId, firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!vendorId || !firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const collectionName = `admin${vendorId}`;
        const newEmployee = new (EmployeeModel(collectionName))({
            vendorId,
            firstName,
            lastName,
            email,
            password,
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus
        });

        await newEmployee.save();

        res.status(201).json({
            message: 'Employee registered successfully!',
            collection: collectionName,
            employeeId: newEmployee.employeeId,
            vendorId,
            email: newEmployee.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
