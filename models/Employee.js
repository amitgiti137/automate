const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const START_USER_ID = 100001;

const EmployeeSchema = new mongoose.Schema({
    userId: { type: Number, unique: true, required: true },
    vendorId: { type: String, required: true },  // Employees get a vendorId from their admin
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    whatsappNumber: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v.toString()); // Ensure it's a valid 10-digit number
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    role: { 
        type: String, 
        enum: ['employee'],  // Only employees can be created
        default: 'employee' 
    },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

// Assign sequential userId and inherit vendorId from admin before saving
EmployeeSchema.pre('validate', async function (next) {
    try {
        if (!this.userId) {
            const lastUser = await mongoose.models.Employee.findOne().sort({ userId: -1 });
            this.userId = lastUser && lastUser.userId ? lastUser.userId + 1 : START_USER_ID;
        }

        if (!this.vendorId) {
            throw new Error("Employee must have an assigned vendorId from an admin.");
        }

    } catch (error) {
        console.error("Error generating userId or setting vendorId:", error);
        return next(error);
    }
    next();
});

// Hash password before saving
/* EmployeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
}); */

if (!global.EmployeeModel) {
    global.EmployeeModel = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
}

module.exports = global.EmployeeModel;
