const mongoose = require("mongoose");
const express = require("express");
const { trim } = require("validator");

const postSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true,
        trim:true
    },
    desc:{
        type:String,
        trim:true
    },
    imgKey:{
        type:String,
    },
    like:{
        likdId:{
            type:String,
            trim:true,
        }
    },
});

const postdb = new mongoose.model("userPosts",postSchema);

module.exports= postdb;

