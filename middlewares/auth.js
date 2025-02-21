const Employee = require('../models/Employee');

const verifyAdmin = async (req, res, next) => {
    const { vendorId, email } = req.body;  // Admin's email must be passed

    try {
        const admin = await Employee.findOne({ vendorId, email, role: "Admin" });

        if (!admin) {
            return res.status(403).json({ error: "Access denied. Only admins can perform this action." });
        }

        next(); // ✅ Proceed to the requested API
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { verifyAdmin };
