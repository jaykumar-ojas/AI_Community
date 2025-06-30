const mongoose = require("mongoose");
const express = require("express");


const BookMarkSchema = new mongoose.Schema({
    userId:{type: String, required: true},
    savedPostId :[
       {type: String}
    ]
});

const bookMarkDb = new mongoose.model("savedPost",BookMarkSchema);

module.exports = bookMarkDb;