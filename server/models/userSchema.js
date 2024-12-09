const mongoose = require("mongoose");
const validator = require("validator")

const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("email is not valid");
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength:8  
    },
    confirmPassword:{
        type:String,
        required:true,
        minlength:8  
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})


// create usermodel

const userdb= new mongoose.model("users",userSchema);

module.exports=userdb;