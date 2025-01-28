const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phoneNumber: { 
        type: Number, 
        required: true, 
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v.toString()); // Ensure it’s a valid 10-digit number
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    /* const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt); */
    next();
});

if (!global.UserModel) {
    global.UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
}

module.exports = global.UserModel;
