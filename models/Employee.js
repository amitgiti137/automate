const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    vendorId: { type: Number, required: true },
    adminId: { type: Number, required: true },
    employeeId: { type: Number, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    whatsappNumber: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

const EmployeeModel = (collectionName) => mongoose.model(collectionName, EmployeeSchema, collectionName);

module.exports = EmployeeModel;
