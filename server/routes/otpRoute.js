const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router(); // Ensure you're using Router correctly
const otpdb = require("../models/otpSchema");
const { body, validationResult } = require("express-validator");
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

            // Generate OTP
            const otp = `${1000 + Math.floor(Math.random() * 9000)}`;

            // Mail options
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verification Code",
                text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
            };

            // Check if the user already exists in the database
            let user = await otpdb.findOne({ email });

            if (user) {
                user.otp = otp;
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
