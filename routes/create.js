const express = require('express');
const AdminModel = require('../models/Admin');
const EmployeeModel = require('../models/Employee');
const jwt = require('jsonwebtoken');
const router = express.Router();

const START_ADMIN_ID = 10001;
const START_VENDOR_ID = 10001;
const START_EMPLOYEE_ID = 100001;

// **Register Admin**
router.post('/register-admin', async (req, res) => {
    const { firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if email already exists
        const existingAdmin = await AdminModel("admins").findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin email already exists' });
        }

        // Get last admin to determine next collection name
        const lastAdmin = await AdminModel("admins").findOne().sort({ userId: -1 });
        const newAdminId = lastAdmin ? lastAdmin.userId + 1 : START_ADMIN_ID;
        const newVendorId = lastAdmin ? lastAdmin.vendorId + 1 : START_VENDOR_ID;

        // Generate unique collection name for the new admin
        const newCollectionName = `admin${newAdminId - 10000}`;

        // Register the new admin in its own collection
        const Admin = AdminModel(newCollectionName);
        const newAdmin = new Admin({
            userId: newAdminId,
            vendorId: newVendorId,
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
            collection: newCollectionName,
            userId: newAdminId,
            vendorId: newVendorId,
            email: newAdmin.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Admin Login**
router.post('/login-admin', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Search in the global "admins" collection
        const admin = await AdminModel("admins").findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (password !== admin.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, admin });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Register Employee (Inside Admin’s Collection)**
router.post('/register-employee', async (req, res) => {
    const { vendorId, firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!vendorId || !firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Find the admin by vendorId
        const admin = await AdminModel("admins").findOne({ vendorId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found for given vendorId' });
        }

        // Use the admin's collection name for employees
        const collectionName = `admin${admin.userId - 10000}`;
        const Employee = EmployeeModel(collectionName);

        // Check if employee email already exists
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ error: 'Employee email already exists' });
        }

        // Get last employee ID
        const lastEmployee = await Employee.findOne().sort({ userId: -1 });
        const newEmployeeId = lastEmployee ? lastEmployee.userId + 1 : START_EMPLOYEE_ID;

        // Create new employee under the admin's collection
        const newEmployee = new Employee({
            userId: newEmployeeId,
            vendorId,
            firstName,
            lastName,
            email,
            password,
            whatsappNumber,
            department,
            designation,
            employeeCode,
            activeStatus,
            role: 'employee'
        });

        await newEmployee.save();

        res.status(201).json({
            message: 'Employee registered successfully!',
            collection: collectionName,
            userId: newEmployeeId,
            vendorId,
            email: newEmployee.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Update Employee Details**
router.put('/update-employee', async (req, res) => {
    const { vendorId, email, updates } = req.body;

    if (!vendorId || !email) {
        return res.status(400).json({ error: 'Vendor ID and email are required' });
    }

    try {
        // Find the admin's collection
        const admin = await AdminModel("admins").findOne({ vendorId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found for given vendorId' });
        }

        const collectionName = `admin${admin.userId - 10000}`;
        const Employee = EmployeeModel(collectionName);

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

// **Fetch All Employees for an Admin**
router.get('/employees', async (req, res) => {
    const { vendorId } = req.query;

    if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' });
    }

    try {
        const admin = await AdminModel("admins").findOne({ vendorId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found for given vendorId' });
        }

        const collectionName = `admin${admin.userId - 10000}`;
        const Employee = EmployeeModel(collectionName);

        const employees = await Employee.find();
        res.json({ employees });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
