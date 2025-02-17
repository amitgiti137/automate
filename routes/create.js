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
        // ✅ Create the admin (admin model handles vendorId generation)
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

        // ✅ Correctly create the collection before responding
        const collectionName = `admin${newAdmin.vendorId - 1000}`;
        const AdminCollection = AdminModel(collectionName);

        res.status(201).json({
            message: 'Admin registered successfully!',
            collection: collectionName,
            vendorId: newAdmin.vendorId,
            employeeId: newAdmin.employeeId,
            email: newAdmin.email
        });

    } catch (err) {
        console.error("Error in register-admin route:", err);
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
