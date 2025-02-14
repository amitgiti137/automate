const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Common Vendor ID for all users
const VENDOR_ID = "123456"; 

const UserSchema = new mongoose.Schema({
    userId: { type: Number, unique: true, required: true },
    vendorId: { type: String, default: VENDOR_ID },
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
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

// Assign sequential userId before saving
UserSchema.pre('validate', async function (next) {
    if (!this.userId) {
        try {
            const lastUser = await mongoose.models.User.findOne().sort({ userId: -1 });

            // If no user exists, start from 100001
            this.userId = lastUser && lastUser.userId ? lastUser.userId + 1 : 100001;

        } catch (error) {
            console.error("Error generating userId:", error);
            return next(error);
        }
    }
    next();
});

// Hash password before saving
/* UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
}); */

if (!global.UserModel) {
    global.UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
}

module.exports = global.UserModel;
