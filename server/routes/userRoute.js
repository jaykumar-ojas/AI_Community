const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema")

// for user registration

router.post("/register",async(req,res)=>{

    const {userName, email, password, confirmPassword} = req.body;

    if(!userName || !email || !password || !confirmPassword){
        res.status(422).json({error:"fill all the details"});
    }
    try{

       const preuser= await userdb.findOne({email:email});

       if(preuser){
        res.status(422).json({error:"user already exist"});
       }
       else if (confirm!=confirmPassword){
        res.status(422).json({error:"password is not matched"});
       }
       else {
        const finaluser=new userdb({
            fname,email,password,confirmPassword
        })
       }
    }
    catch(errr){
        console.log(errr);
    }
})

module.exports=router;