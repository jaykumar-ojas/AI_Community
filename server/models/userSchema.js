const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";

const userSchema = new mongoose.Schema({
    userName:{ type:String, required:true,trim:true},
    password:{ type:String, required:true, minlength:8 },
    confirmPassword:{ type:String, required:true,minlength:8  },
    profilePicture:{ type:String, default:""},
    profilePictureUrl :{ type: String, default:""},
    backgroundImage:{ type:String, default:""},
    backgroundImageUrl:{ type: String, default:""},
    email:{ type:String, required:true,unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("email is not valid");
            }
        }
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ],
    forget_tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})




// hash the password
userSchema.pre("save",async function(next){
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.confirmPassword = await bcrypt.hash(this.confirmPassword,12);
    }
    next();
})

// create token

userSchema.methods.generateAuthToken = async function() {
    try{
        
        let token = jwt.sign({_id:this._id},keySecret,{
            expiresIn:"1d"
        });
    
        this.tokens=this.tokens.concat({token:token});

        await this.save();
        return token;
    }
    catch(error){
        console.log(error);
        res.status(422).json(error);
    }
}

userSchema.methods.generateForgetToken = async function() {
    try{
        console.log("i am genreate token");
        let token = jwt.sign({email:this.email},keySecret,{
            expiresIn:"300s"
        });
    
        this.tokens=this.forget_tokens.concat({token:token});

        await this.save();
        return token;
    }
    catch(error){
        console.log(error);
        res.status(422).json(error);
    }
}


// create usermodel

const userdb= new mongoose.model("users",userSchema);


module.exports=userdb;