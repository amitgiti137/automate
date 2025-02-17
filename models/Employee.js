const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    vendorId: { type: Number, required: true },  // Passed in payload
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

// ✅ Auto-generate `employeeId` before saving
EmployeeSchema.pre('validate', async function (next) {
    try {
        if (!this.vendorId) {
            return next(new Error("vendorId is required"));
        }

        const collectionName = `admin${this.vendorId}`;
        const lastEmployee = await mongoose.connection.db.collection(collectionName).findOne({}, { sort: { employeeId: -1 } });

        if (!lastEmployee) {
            this.employeeId = this.vendorId * 10000 + 2; // First employee after admin (10002, 20002, 30002)
        } else {
            this.employeeId = lastEmployee.employeeId + 1; // Next employee (10003, 10004...)
        }

        next();
    } catch (error) {
        return next(error);
    }
});

// ✅ Store Employees in the correct admin collection
const EmployeeModel = (collectionName) => mongoose.model(collectionName, EmployeeSchema, collectionName);

module.exports = EmployeeModel;
