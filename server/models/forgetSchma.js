const mongoose = require("mongoose");
const express = require("express");


const forgetOtpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String
    }
});



const forgetotpdb = new mongoose.model("forgetOtp",forgetOtpSchema);

module.exports = forgetotpdb;