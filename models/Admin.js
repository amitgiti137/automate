const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    vendorId: { type: Number, unique: true, required: true },
    employeeId: { type: Number, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    whatsappNumber: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin'], required: true, default: 'admin' },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

const AdminModel = (collectionName) => mongoose.model(collectionName, AdminSchema, collectionName);

module.exports = AdminModel;
