const express = require('express');
const AdminModel = require('../models/Admin');
const EmployeeModel = require('../models/Employee');
const router = express.Router();

// Start values
const START_VENDOR_ID = 1001;
const START_ADMIN_ID = 1001;
const START_EMPLOYEE_ID = 10001;

// **Register Admin (Admin is Also an Employee)**
router.post('/register-admin', async (req, res) => {
    const { firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Find the last registered admin
        const lastAdmin = await AdminModel("admins").findOne().sort({ vendorId: -1 });

        let newVendorId, newAdminId, newEmployeeId;

        if (!lastAdmin) {
            // First Admin Registration
            newVendorId = START_VENDOR_ID;
            newAdminId = START_ADMIN_ID;
            newEmployeeId = START_EMPLOYEE_ID;
        } else {
            // Next Admin Registration
            newVendorId = lastAdmin.vendorId + 1000;  // 1001 -> 2001 -> 3001 ...
            newAdminId = lastAdmin.adminId + 1000;    // 1001 -> 2001 -> 3001 ...
            newEmployeeId = lastAdmin.employeeId + 10000; // 10001 -> 20001 -> 30001 ...
        }

        // Create a unique collection name for each admin
        const newCollectionName = `admin${newAdminId}`;

        // Register the new admin (who is also an employee)
        const Admin = AdminModel(newCollectionName);
        const newAdmin = new Admin({
            vendorId: newVendorId,
            adminId: newAdminId,
            employeeId: newEmployeeId, // Admin is also Employee
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
            vendorId: newVendorId,
            adminId: newAdminId,
            employeeId: newEmployeeId,
            email: newAdmin.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Register Employee (First Employee Becomes Admin, Others Employees)**
router.post('/register-employee', async (req, res) => {
    const { vendorId, adminId, firstName, lastName, email, password, whatsappNumber, department, designation, employeeCode, activeStatus } = req.body;

    if (!vendorId || !adminId || !firstName || !lastName || !email || !password || !whatsappNumber || !department || !designation || !employeeCode || !activeStatus) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Find the Admin's Collection
        const admin = await AdminModel("admins").findOne({ vendorId, adminId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found for given vendorId and adminId' });
        }

        // Use the admin's collection name for employees
        const collectionName = `admin${admin.adminId}`;
        const Employee = EmployeeModel(collectionName);

        // Get last employee ID
        const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
        const newEmployeeId = lastEmployee ? lastEmployee.employeeId + 1 : admin.employeeId + 1;

        // First Employee under Admin gets **Admin Role**
        const employeeRole = (newEmployeeId === admin.employeeId + 1) ? 'admin' : 'employee';

        // Register the employee
        const newEmployee = new Employee({
            vendorId,
            adminId,
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
            adminId,
            role: employeeRole,
            email: newEmployee.email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
