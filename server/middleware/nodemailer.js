const nodemailer = require("nodemailer");
const express = require("nodemailer");
const jwt = require("jsonwebtoken");
const otpdb = require("../models/otpSchema");
const userdb = require("../models/userSchema")

const dotenv = require("dotenv").config(); 

const transporter= nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS, // Use environment variables
    }
})

const generateOtp = async(req,res,next)=>{
    console.log("i ma here to generate otp");
    try{
        const email = req.body.email;
        console.log(email);
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
        console.log(otp);
        
        const user = await userdb.findOne({email:email});
        if(!user){
            res.status(422).json("user not exist");
            return;
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error){
                throw new error("email not send");
            }
        })
        console.log("i m here to send otp");
        req.otp=otp;
        console.log(req.otp);
        console.log("i send otp");
        next();
    }
    catch(error){
        res.status(422).json({status:422,error:"email not sent or may be some error occured"});
    }
}

module.exports = generateOtp;