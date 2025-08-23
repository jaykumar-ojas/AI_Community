const nodemailer = require("nodemailer");
const express = require("express"); // Fixed: was "nodemailer", should be "express"
const jwt = require("jsonwebtoken");
const otpdb = require("../models/otpSchema");
const userdb = require("../models/userSchema");
const dotenv = require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Set this to system.pixxelmind@gmail.com in .env
        pass: process.env.EMAIL_PASS, // Set this to your app password in .env
    }
});

const generateOtp = async (req, res, next) => {
    console.log("I am here to generate otp");
    try {
        const email = req.body.email;
        console.log(email);

        if (!email) {
            throw new Error("Email is required"); // Fixed: Error with capital E
        }

        const otp = `${1000 + Math.floor(Math.random() * 9000)}`;

        const mailOptions = {
            from: 'system.pixxelmind@gmail.com',
            to: email,
            subject: "OTP Verification",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
                    <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">🔐 Email Verification</h2>
                    
                    <p style="color: #333; font-size: 16px; text-align: center;">
                        Hello, <br> Your One-Time Password (OTP) for verification is:
                    </p>
        
                    <div style="background: linear-gradient(135deg, #007bff, #00c6ff); padding: 15px; border-radius: 8px; text-align: center; margin: 20px auto; width: fit-content; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <span style="font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">${otp}</span>
                    </div>
        
                    <p style="color: #555; font-size: 14px; text-align: center;">
                        ⚠️ This OTP will expire in <b>5 minutes</b>.
                    </p>
        
                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                        If you didn’t request this, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `Your OTP is ${otp}. It will expire in 5 minutes.`
        };
        

        console.log("Generated OTP:", otp);
        const user = await userdb.findOne({ email: email });
        if (!user) {
            return res.status(422).json({ error: "User does not exist" });
        }

        // Send email with promise-based approach for better error handling
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log("Email sent successfully:", info.messageId);
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            throw new Error("Failed to send email");
        }

        console.log("I am here to send otp");
        req.otp = otp;
        console.log("Request OTP:", req.otp);
        console.log("OTP sent successfully");

        next();

    } catch (error) {
        console.error("Error in generateOtp:", error);
        res.status(422).json({
            status: 422,
            error: "Email not sent or some error occurred",
            details: error.message
        });
    }
};