const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router(); // Ensure you're using Router correctly
const otpdb = require("../models/otpSchema");
const { body, validationResult } = require("express-validator");
const User = require("../models/userSchema");
const dotenv = require("dotenv").config(); 

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS, // Use environment variables
    },
});

// OTP Route
router.post(
    '/send-otp',
    async (req, res) => {
        console.log(req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const email = req.body.email;

            // CHECK IF USER ALREADY EXISTS IN MAIN DATABASE
            // Replace 'User' with your actual user model name (e.g., userdb, Users, etc.)
            const existingUser = await User.findOne({ email: email });
            
            if (existingUser) {
                return res.status(409).json({
                    status: 409,
                    message: "User with this email already exists. Please login instead."
                });
            }

            // Generate OTP
            const otp = `${1000 + Math.floor(Math.random() * 9000)}`;

            // Mail options
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verification Code",
                text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
            };
            console.log("this is otp",otp);

            // Check if the user already has an OTP entry
            let user = await otpdb.findOne({ email });

            if (user) {
                user.otp = otp;
                user.createdAt = new Date(); // Update timestamp for new OTP
                await user.save();
            } else {
                const newOtpEntry = new otpdb({
                    email,
                    otp,
                });
                await newOtpEntry.save();
            }

            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    return res.status(500).json({
                        status: 500,
                        message: "Failed to send email. Please try again later.",
                    });
                } else {
                    console.log("Email sent:", info.response);
                    return res.status(200).json({
                        status: 200,
                        message: "OTP sent successfully.",
                    });
                }
            });
        } catch (error) {
            console.error("Error in OTP route:", error);
            res.status(500).json({
                status: 500,
                message: "An error occurred. Please try again.",
            });
        }
    }
);

// Registration OTP verification endpoint
router.post("/verify-otp/:id", async (req, res) => {
    try {
        const { enteredOtp } = req.body;
        const email = userS
        if (!enteredOtp) {
            return res.status(400).json({ status: 400, error: "OTP is required" });
        }
        if (!email) {
            return res.status(400).json({ status: 400, error: "Email is required" });
        }
        // Find OTP record by email in otpdb (registration)
        const otpRecord = await otpdb.findOne({ email: email });
        if (!otpRecord) {
            return res.status(404).json({ status: 404, error: "OTP not found or expired" });
        }
        // Compare OTPs as strings
        if (String(otpRecord.otp) !== String(enteredOtp)) {
            return res.status(401).json({ status: 401, error: "Invalid OTP" });
        }
        // Optionally, delete the OTP record after successful verification
        // await otpdb.deleteOne({ email: email });
        res.status(200).json({ status: 200, message: "OTP verified successfully" });
    } catch (error) {
        console.error("OTP verification error (registration):", error);
        res.status(500).json({ status: 500, error: "Internal server error" });
    }
});

// router.post("/forget-password",async(req,res)=>{
//     async (req, res) => {
//         console.log(req.body);
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         try {
//             const email = req.body.email;

//             // Generate OTP
//             const otp = `${1000 + Math.floor(Math.random() * 9000)}`;

//             // Mail options
//             const mailOptions = {
//                 from: process.env.EMAIL_USER,
//                 to: email,
//                 subject: "Verification Code",
//                 text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
//             };

//             // Check if the user already exists in the database
//             let user = await otpdb.findOne({ email });

//             if (user) {
//                 user.otp = otp;
//                 await user.save();
//             } else {
//                 const newOtpEntry = new otpdb({
//                     email,
//                     otp,
//                 });
//                 await newOtpEntry.save();
//             }

//             // Send email
//             transporter.sendMail(mailOptions, (error, info) => {
//                 if (error) {
//                     console.error("Error sending email:", error);
//                     return res.status(500).json({
//                         status: 500,
//                         message: "Failed to send email. Please try again later.",
//                     });
//                 } else {
//                     console.log("Email sent:", info.response);
//                     return res.status(200).json({
//                         status: 200,
//                         message: "OTP sent successfully.",
//                     });
//                 }
//             });
//         } catch (error) {
//             console.error("Error in OTP route:", error);
//             res.status(500).json({
//                 status: 500,
//                 message: "An error occurred. Please try again.",
//             });
//         }
//     }
// })

module.exports = router;
