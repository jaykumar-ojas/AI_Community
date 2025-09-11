const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const modelCreditConfig = require("../config/modelCreditConfig");

// Middleware to validate user's credit
const validateCredit = async (req, res, next) => {
    try {
        console.log("i m here for that");
        const {model,type} = req.body;
        const userId= req.userId;
        console.log("succeffuly getting userid",userId);
        const modelCredit = modelCreditConfig[type][model].cost;

        // Find user in either collection
        console.log("i got credit alos",modelCredit);
        const user = await userdb.findById(userId) || await googledb.findById(userId);

        if (!user) {
            return res.status(400).json({ 
                status: 400, 
                message: "User does not exist" 
            });
        }

        // Check if user has enough credit
        if (user.credit > modelCredit) {
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


const reduceCredit = async (userId,credit) => {
    try {
        const user = await userdb.findById(userId) || await googledb.findById(userId);
        if (!user) return;

        user.credit = Math.max(0, user.credit - credit); 
        await user.save();


        console.log(`Credit reduced. New credit: ${user.credit}`);
        return user.credit;
    } catch (error) {
        console.error("Error reducing credit:", error);
    }
};

const resetAllCredits = async () => {
  try {
    // Set all users' credit = 50
    const userResult = await userdb.updateMany(
      {}, // no filter → applies to all docs
      { $set: { credit: 50 } }
    );

    // Set all google users' credit = 50
    const googleResult = await googledb.updateMany(
      {},
      { $set: { credit: 50 } }
    );

    console.log("✅ User collection reset:", userResult.modifiedCount);
    console.log("✅ Google collection reset:", googleResult.modifiedCount);
  } catch (err) {
    console.error("❌ Error resetting credits:", err);
  }
};


module.exports = { validateCredit, reduceCredit,resetAllCredits };
