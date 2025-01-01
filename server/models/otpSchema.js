const mongoose = require("mongoose");
const express = require("express");

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true
    }
},{timestamps:true});

const otpdb = new mongoose.model("otpVerify",otpSchema);

module.exports = otpdb;