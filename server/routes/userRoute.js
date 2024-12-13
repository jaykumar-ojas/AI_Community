const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
const bcrypt = require("bcryptjs");

const authenticate = require("../middleware/authenticate");

// for user registration

router.post("/register",async(req,res)=>{
    console.log(req.body);

    const {userName, email, password, confirmPassword} = req.body;

    if(!userName || !email || !password || !confirmPassword){
        res.status(422).json({error:"fill all the details"});
    }
    try{

       const preuser= await userdb.findOne({email:email});

       if(preuser){
        res.status(422).json({error:"user already exist"});
       }
       else if (password!=confirmPassword){
        res.status(422).json({error:"password is not matched"});
       }
       else {
        const finaluser=new userdb({
            userName,email,password,confirmPassword
        })

        const storedata= await finaluser.save();
        console.log(storedata);
        res.status(201).json(storedata);
       }
    }
    catch(errr){
        console.log("some error occurd in registration");
        res.status(422).json({error:"some error occured"});
        
    }
})


// for user login

router.post("/login",async(req,res)=>{
    console.log(req.body);
    const {email,password} = req.body;
    console.log("1");
    if(! email || !password){
        res.status(422).json({error:"please enter reqyired field"});
    }

    try{
        console.log("2");
        const uservalid= await userdb.findOne({email:email});
        console.log("this si ",uservalid);
        if(uservalid){

            const isvalid = await bcrypt.compare(password,uservalid.password);
            console.log("3");
            if(!isvalid){
                res.status(422).json({error:"invalid details"});
            }
            else{
                console.log("4");
                const token = await uservalid.generateAuthToken();
                console.log(token);
                res.cookie("usercookie",token,{
                    expires : new Date(Date.now()+9000000),
                    httpOnly : true
                })

                const result={
                    uservalid,
                    token
                }
                console.log(result);
                res.status(201).json(result);
            }

        }

    }
    catch(error){
        console.log("invalid details");
    }
})

// for token validation

router.get("/validuser",authenticate,async(req,res)=>{
   try{
    const validuserone = await userdb.findOne({_id:req.userId});
    res.status(201).json({status:201,validuserone});
   }
   catch(error){
    res.status(401).json({status:401,error});
   }
})

router.get("/logout",authenticate,async(req,res)=>{
    console.log("i am here");
    try{
        req.rootuser.tokens = req.rootuser.tokens.filter((currelem)=>{
            return currelem.token !== req.token
        })
        res.clearCookie("usercookie",{path:"/"});
        req.rootuser.save();
        res.status(201).json(req.rootuser.tokens);
    }
    catch(error){
        res.status(401).json({status:401,error});
    }
})

module.exports=router;