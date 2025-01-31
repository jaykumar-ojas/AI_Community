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

router.post("/verify-otp",authenticate,async(req,res)=>{
    try {
        const otp = req.body.enteredOtp;
        console.log(otp,"this is otp");
        if(!req.rootuser){
            throw new Error("user not exist");
        }
        const user = req.rootuser;
        const email = user.email;
        const otpuser = await forgetotpdb.findOne({email:email});
        console.log(otpuser);
        if(otpuser.otp!==otp){
            res.status(401).json({status:401,error:"otp not matched"});
            return;
        }
        const token = await user.generateForgetToken();
        res.status(200).json({status:200,token:token});
    } catch (error) {
        res.status(401).json({status:422,error:error.message});
    }
})

router.post("/update-password",authenticate,async(req,res)=>{
    try{
        const {password,confirmPassword} = req.body;
        if(password!==confirmPassword){
            throw new Error("user is password doesn't match");
        }
        const updateuser=req.rootuser;
        updateuser.password = password;
        updateuser.confirmPassword = confirmPassword;
        await updateuser.save();
        res.status(200).json({status:200,message:"password update succefully"});

    }catch(error){
        res.status(422).json({status:422,error:"unauthorised user"});
    }
})

module.exports = router;
