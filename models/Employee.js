const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: Number, unique: true, required: true }, // Sequential ID per vendor
    vendorId: { type: Number, required: true }, 
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

// Generate employeeId before saving
EmployeeSchema.pre('validate', async function (next) {
    try {
        if (!this.vendorId) {
            return next(new Error("Vendor ID is required for employees."));
        }

        const adminExists = await mongoose.models.Admin.findOne({ vendorId: this.vendorId });
        if (!adminExists) {
            return next(new Error("Invalid Vendor ID. No such admin exists."));
        }

        this.employeeId = await generateNextEmployeeId(this.vendorId);
    } catch (error) {
        return next(error);
    }
    next();
});

// Generate next employeeId based on vendorId
async function generateNextEmployeeId(vendorId) {
    const lastEmployee = await mongoose.models.Employee.findOne({ vendorId }).sort({ employeeId: -1 });
    return lastEmployee && lastEmployee.employeeId ? lastEmployee.employeeId + 1 : vendorId * 10000 + 1;
}

if (!global.EmployeeModel) {
    global.EmployeeModel = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
}

module.exports = global.EmployeeModel;
