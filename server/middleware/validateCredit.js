const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");

// Middleware to validate user's credit
const validateCredit = async (req, res, next) => {
    try {
        const { userId } = req.body;

        // Find user in either collection
        const user = await userdb.findById(userId) || await googledb.findById(userId);

        if (!user) {
            return res.status(400).json({ 
                status: 400, 
                message: "User does not exist" 
            });
        }

        // Check if user has enough credit
        if (user.credit > 0) {
            req.user = user; // attach user to req for later use
            next();
        } else {
            return res.status(403).json({
                status: 403,
                message: "Insufficient credit"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 500, 
            error: "Internal server error" 
        });
    }
};


const reduceCredit = async (userId) => {
    try {
        const user = await userdb.findById(userId) || await googledb.findById(userId);
        if (!user) return;

        user.credit = Math.max(0, user.credit - 1); 
        await user.save();

        console.log(`Credit reduced. New credit: ${user.credit}`);
    } catch (error) {
        console.error("Error reducing credit:", error);
    }
};

module.exports = { validateCredit, reduceCredit };
