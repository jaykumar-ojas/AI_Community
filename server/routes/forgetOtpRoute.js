const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
const forgetotpdb = require("../models/forgetSchma");
const nodemailer = require("nodemailer");
const generateOtp = require("../middleware/nodemailer");
const authenticate = require("../middleware/authenticate");
const otpdb = require("../models/otpSchema");

router.post("/forget-password", generateOtp, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new Error("Email is required");
        }

        const user = await userdb.findOne({ email });
        if (!user) {
            return res.status(422).json({ status: 422, message: "User does not exist" });
        }

        const token = await user.generateForgetToken(); // Ensure this method exists
        const forgetUser = await forgetotpdb.findOne({ email });

        if (!forgetUser) {
            const newOtpEntry = new forgetotpdb({
                email,
                otp: req.otp
            });
            await newOtpEntry.save();
        } else {
            forgetUser.otp = req.otp;
            await forgetUser.save();
        }

        // Send token in response for frontend handling
        res.status(200).json({
            status: 200,
            message: "OTP sent successfully",
            token
        });
    } catch (error) {
        res.status(422).json({ status: 422, error: error.message });
    }
});

router.get('/isvalid',authenticate,async(req,res)=>{
    try{
        res.status(201).json({status:201,message:"user is verified"})
    }catch(error){
        res.status(422).json({status:422,error:error.message});
    }
})

// router.post("/verify-otp", async(req,res)=>{
//     try {
//         const { email, enteredOtp } = req.body;
//         console.log(enteredOtp, "this is otp");
//         console.log(email, "this is email");
        
//         if(!enteredOtp){
//             return res.status(400).json({status:400, error:"OTP is required"});
//         }
        
//         if(!email){
//             return res.status(400).json({status:400, error:"Email is required"});
//         }

//         // Find OTP record by email instead of relying on req.rootuser
//         const otpRecord = await forgetotpdb.findOne({email: email});
//         console.log(otpRecord, "OTP record found");
        
//         if(!otpRecord){
//             return res.status(404).json({status:404, error:"OTP not found or expired"});
//         }
        
//         // Convert both to string for comparison to avoid type issues
//         if(String(otpRecord.otp) !== String(enteredOtp)){
//             return res.status(401).json({status:401, error:"Invalid OTP"});
//         }
        
//         // OTP is valid - you might want to delete the OTP record here
//         // await forgetotpdb.deleteOne({email: email});
        
//         res.status(200).json({status:200, message:"OTP verified successfully"});
        
//     } catch (error) {
//         console.error("OTP verification error:", error);
//         res.status(500).json({status:500, error:"Internal server error"});
//     }
// })

router.post("/update-password",authenticate,async(req,res)=>{
    try{
        console.log(req.body,"this is req.body");
        const {password,confirmPassword} = req.body;
        if(password!==confirmPassword){
            throw new Error("user is password doesn't match");
        }
        const updateuser=req.rootuser;
        updateuser.password = password;
        updateuser.confirmPassword = confirmPassword;
        await updateuser.save();
        res.status(200).json({status:200,message:"password update succefully"});
        console.log(res.status,"this is res.status");
    }catch(error){
        console.log(error,"this is error");
        res.status(422).json({status:422,error:"unauthorised user"});
    }
})

module.exports = router;
