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
    fileType:{
        type:String,
        enum: ['image', 'video', 'audio'],
        default: 'image'
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

