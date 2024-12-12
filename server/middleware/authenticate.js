const jwt = require("jsonwebtoken");
const userdb = require("../models/userSchema");
const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";

const authenticate = async(req,res,next)=>{

    try{
        const token= req.headers.authorization;
        // console.log(token);
        const verifytoken = await jwt.verify(token,keySecret);
        // console.log(verifytoken);
        const rootuser = await userdb.findOne({_id:verifytoken._id});
        if(!rootuser){
            throw new error("user not valid");
        }

        req.token=token;
        req.rootuser=rootuser;
        req.userId=rootuser._id;

        next();
    }
    catch(error){
        res.status(401).json({status:401,error:"unauthorized user"});
    }
}

module.exports = authenticate;
