const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";

const googleSchema = new mongoose.Schema({
    googleId: { type: String, default: "" }, 
    userName: { type: String, default: "" },
    email: { type: String, required: true }, // Ensures email is always provided
    image: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    profilePictureUrl: { type: String, default: "" },
    backgroundImage: { type: String, default: "" },
    backgroundImageUrl: { type: String, default: "" },
    tokens :[
        {
        token:{
            type:String,
            required: true
        }
    }
    ], // Ensures tokens is always an empty array
}, { timestamps: true });







googleSchema.methods.generateAuthToken = async function() {
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

const googledb = new mongoose.model("googleAuth",googleSchema);

module.exports = googledb;