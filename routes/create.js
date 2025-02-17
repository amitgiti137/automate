const express = require('express');
const AdminModel = require('../models/Admin');
const EmployeeModel = require('../models/Employee');
const router = express.Router();

// Constants for Vendor & Employee Sequences
const START_VENDOR_ID = 1001;
const START_EMPLOYEE_ID = 10001;
const VENDOR_INCREMENT = 1;
const EMPLOYEE_INCREMENT = 10000;

// **Register Admin**
router.post('/register-admin', async (req, res) => {
    const { firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        let newVendorId, newEmployeeId;

        // Find the last registered admin to determine new vendorId and employeeId
        const lastAdmin = await AdminModel("admins").findOne().sort({ vendorId: -1 });

        if (!lastAdmin) {
            // First Admin (Start with default values)
            newVendorId = 1001;
            newEmployeeId = 10001;
        } else {
            // Generate next `vendorId` and `employeeId` sequence
            newVendorId = lastAdmin.vendorId + 1;  // 1001 → 1002 → 1003 ...
            newEmployeeId = (lastAdmin.vendorId + 1) * 10000 + 1; // 10001 → 20001 → 30001 ...
        }

        // Create a unique collection for the new admin
        const collectionName = `admin${newVendorId}`;
        const Admin = AdminModel(collectionName);

        const newAdmin = new Admin({
            vendorId: newVendorId,
            employeeId: newEmployeeId,
            firstName,
            lastName,
            email,
            password,
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus,
            role: 'admin'
        });

        await newAdmin.save();

        res.status(201).json({
            message: 'Admin registered successfully!',
            collection: collectionName,
            vendorId: newVendorId,
            employeeId: newEmployeeId,
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
        // Determine correct admin collection
        const collectionName = `admin${vendorId}`;
        const Employee = EmployeeModel(collectionName);
        const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });

        if (!lastEmployee) {
            return res.status(404).json({ error: 'Admin not found for given vendorId' });
        }

        // Generate Employee ID
        const newEmployeeId = lastEmployee.employeeId + 1;
        const employeeRole = (newEmployeeId === lastEmployee.employeeId + 1) ? 'admin' : 'employee';

        // Create Employee in the same Admin collection
        const newEmployee = new Employee({
            vendorId,
            employeeId: newEmployeeId,
            firstName,
            lastName,
            email,
            password,
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus,
            role: employeeRole
        });

        await newEmployee.save();

        res.status(201).json({
            message: 'Employee registered successfully!',
            collection: collectionName,
            employeeId: newEmployeeId,
            vendorId,
            role: employeeRole,
            email: newEmployee.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
