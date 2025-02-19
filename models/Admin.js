const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    vendorId: { type: Number, unique: true, required: true }, 
    employeeId: { type: Number, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, 
    whatsappNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

// Generate vendorId before saving a new admin
AdminSchema.pre('validate', async function (next) {
    try {
        const lastAdmin = await mongoose.models.Admin.findOne().sort({ vendorId: -1 });
        this.vendorId = lastAdmin && lastAdmin.vendorId ? lastAdmin.vendorId + 1 : 1;

        // ✅ Generate employeeId using vendorId
        this.employeeId = this.vendorId * 10000 + 1;
    } catch (error) {
        return next(error);
    }
    next();
});

if (!global.AdminModel) {
    global.AdminModel = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
}

module.exports = global.AdminModel;
