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

// ✅ Auto-generate `vendorId` and `employeeId` for Admins
AdminSchema.pre('validate', async function (next) {
    try {
        const lastAdmin = await mongoose.connection.db.collection("admins").findOne({}, { sort: { vendorId: -1 } });

        if (!lastAdmin) {
            this.vendorId = 1001; // First admin
            this.employeeId = 10001; // First admin's employeeId
        } else {
            this.vendorId = lastAdmin.vendorId + 1; // 1001 → 1002 → 1003 ...
            this.employeeId = this.vendorId * 10000 + 1; // 10001 → 20001 → 30001 ...
        }

        next();
    } catch (error) {
        return next(error);
    }
});

// ✅ Create a new collection dynamically for each Admin
const AdminModel = (collectionName) => mongoose.model(collectionName, AdminSchema, collectionName);

module.exports = AdminModel;
