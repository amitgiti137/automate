const mongoose = require('mongoose');

const START_USER_ID = 100001;

const EmployeeSchema = new mongoose.Schema({
    userId: { type: Number, unique: true, required: true },
    vendorId: { type: String, required: true },  
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
                return /^\d{10}$/.test(v.toString()); 
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    role: { 
        type: String, 
        enum: ['employee'],  
        default: 'employee' 
    },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employeeCode: { type: String, required: true },
    activeStatus: { type: String, required: true },
}, { timestamps: true });

// ✅ Assign unique userId before saving
EmployeeSchema.pre('validate', async function (next) {
    try {
        if (!this.userId) {
            const lastUser = await mongoose.connection.db.collection(this.collection.name).findOne({}, { sort: { userId: -1 } });
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

// ✅ Store employees in the admin's unique collection (e.g., "admin1", "admin2")
const EmployeeModel = (collectionName) => mongoose.model(collectionName, EmployeeSchema, collectionName);

module.exports = EmployeeModel;
