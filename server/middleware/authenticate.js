const jwt = require("jsonwebtoken");
const userdb = require("../models/userSchema");
const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";
const goodledb = require("../models/googleSchema");

const authenticate = async(req, res, next) => {
    try {
        const token = req.headers.authorization;
        
        if (!token) {
            console.log("No token provided");
            return res.status(401).json({status: 401, error: "No authentication token provided"});
        }
        
        try {
            const verifytoken = await jwt.verify(token, keySecret);
            console.log("Token verified:", verifytoken);
            
            // Try to find the user in different collections
            const rootuser = await userdb.findOne({email: verifytoken.email}) || 
                             await userdb.findOne({_id: verifytoken._id}) || 
                             await goodledb.findOne({_id: verifytoken._id});
            
            if (!rootuser) {
                console.log("User not found");
                return res.status(401).json({status: 401, error: "User not found"});
            }
            
            req.token = token;
            req.rootuser = rootuser;
            req.userId = rootuser._id;
            req.userRole = rootuser.role || 'user';
            
            next();
        } catch (jwtError) {
            console.log("JWT verification failed:", jwtError);
            return res.status(401).json({status: 401, error: "Invalid token"});
        }
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({status: 401, error: "Authentication failed"});
    }
}

module.exports = authenticate;
