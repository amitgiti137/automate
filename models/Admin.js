const mongoose = require('mongoose');

const START_VENDOR_ID = 10001;
const START_USER_ID = 10001;

const AdminSchema = new mongoose.Schema({
    userId: { type: Number, unique: true, required: true },
    vendorId: { type: Number, unique: true, required: true },
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
        enum: ['admin'],  
        required: true,
        default: 'admin' 
    },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

// ✅ Assign unique userId and vendorId before saving 
AdminSchema.pre('validate', async function (next) {
    try {
        if (!this.userId) {
            const lastUser = await mongoose.connection.db.collection("admins").findOne({}, { sort: { userId: -1 } });
            this.userId = lastUser && lastUser.userId ? lastUser.userId + 1 : START_USER_ID;
        }

        if (!this.vendorId) {
            const lastVendor = await mongoose.connection.db.collection("admins").findOne({}, { sort: { vendorId: -1 } });
            this.vendorId = lastVendor && lastVendor.vendorId ? lastVendor.vendorId + 1 : START_VENDOR_ID;
        }

    } catch (error) {
        console.error("Error generating userId or vendorId:", error);
        return next(error);
    }
    next();
});

// ✅ Create a unique collection name for each Admin (e.g., "admin1", "admin2", ...)
const AdminModel = (collectionName) => mongoose.model(collectionName, AdminSchema, collectionName);

module.exports = AdminModel;
