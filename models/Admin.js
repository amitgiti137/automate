const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    vendorId: { type: Number, unique: true, required: true },
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

// ✅ Ensure `vendorId` is created before saving
AdminSchema.pre('validate', async function (next) {
    try {
        const lastAdmin = await mongoose.connection.db.collection("admins").findOne({}, { sort: { vendorId: -1 } });

        if (!lastAdmin) {
            this.vendorId = 1001; // First admin starts with 1001
        } else {
            this.vendorId = lastAdmin.vendorId + 1; // 1001 → 1002 → 1003
        }

        next();
    } catch (error) {
        return next(error);
    }
});

// ✅ Create collection dynamically before saving
AdminSchema.pre('save', async function (next) {
    try {
        const collectionName = `admin${this.vendorId}`; // Creates collections as admin1001, admin1002, admin1003...
        
        if (!mongoose.connection.models[collectionName]) {
            mongoose.model(collectionName, AdminSchema, collectionName);
        }

        next();
    } catch (error) {
        return next(error);
    }
});

// ✅ Function to create a new Admin collection dynamically
const AdminModel = (collectionName) => {
    if (!mongoose.connection.models[collectionName]) {
        return mongoose.model(collectionName, AdminSchema, collectionName);
    }
    return mongoose.connection.models[collectionName];
};

module.exports = AdminModel;
