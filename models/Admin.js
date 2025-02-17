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

// ✅ Generate `vendorId` and `employeeId` before saving
AdminSchema.pre('validate', async function (next) {
    try {
        const lastAdmin = await mongoose.connection.db.collection("admins").findOne({}, { sort: { vendorId: -1 } });

        if (!lastAdmin) {
            console.log("No admin exists, setting first admin defaults...");
            this.vendorId = 1001; // First admin starts at 1001
            this.employeeId = 10001; // First admin's employeeId
        } else {
            console.log("Last admin found, setting next vendorId...");
            this.vendorId = lastAdmin.vendorId + 1; // 1001 → 1002 → 1003
            this.employeeId = this.vendorId * 10000 + 1; // 10001 → 20001 → 30001
        }

        next();
    } catch (error) {
        console.error("Error generating vendorId:", error);
        return next(error);
    }
});

// ✅ Ensure collection is created before saving
AdminSchema.pre('save', async function (next) {
    try {
        const collectionName = `admin${this.vendorId - 1000}`; // admin1, admin2, admin3

        // ✅ Ensure collection is registered before inserting data
        if (!mongoose.connection.models[collectionName]) {
            mongoose.model(collectionName, AdminSchema, collectionName);
        }

        next();
    } catch (error) {
        return next(error);
    }
});

// ✅ Create a new collection dynamically for each Admin
const AdminModel = (collectionName) => {
    if (!mongoose.connection.models[collectionName]) {
        return mongoose.model(collectionName, AdminSchema, collectionName);
    }
    return mongoose.connection.models[collectionName];
};

module.exports = AdminModel;
