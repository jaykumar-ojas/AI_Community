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
    imgUrl:{
        type:String,
    },
    imgUrlCreatedAt:{
        type:Date,
    },
    fileType:{
        type:String,
        enum: ['image', 'video', 'audio'],
        default: 'image'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

postSchema.pre('save', function (next) {
    if (this.isModified('imgUrl')) {
        this.imgUrlCreatedAt = Date.now();
    }
    next();
});

const postdb = new mongoose.model("userPosts",postSchema);

module.exports= postdb;

