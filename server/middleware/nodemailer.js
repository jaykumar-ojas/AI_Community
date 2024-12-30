const nodemailer = require("nodemailer");
const express = require("nodemailer");
const jwt = require("jsonwebtoken");
const otpdb = require("../models/otpSchema");

const transporter= nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:'vishusingh314159@gmail.com',
        pass:"trto fvte dcls sxgd"
    }
})

const generateOtp = async(req,res,next)=>{
    try{
        const email = req.body.email;
        if(!email){
            throw new error("email is required");
        }
        const otp=`${1000+Math.floor(Math.random()*9000)}`;
        const mailOptions = {
            from:'guptajaykumar201@gmail.com',
            to: email,
            subject:"Send link for Verify user",
            text:`your otp is ${otp} expired in 5 minute`
        }
        
        const user = await otpdb.findOne({email:email});
        if(user){
            user.otp = otp;
            await user.save();
        }
        else{
            const finalOtp = new otpdb({
                email :email,
                otp : otp
            })
            await finalOtp.save();
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error){
                throw new error("email not send");
            }
        })
        next();
    }
    catch(error){
        res.status(422).json({status:422,error:"email not sent or may be some error occured"});
    }
}