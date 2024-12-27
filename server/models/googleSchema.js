const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";

const googleSchema = new mongoose.Schema({
    googleId : String,
    userName : String,
    email : String,
    image : String,
    tokens:[{
        token:{
            type:String
        }
    }]
},{timestamps : true});

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