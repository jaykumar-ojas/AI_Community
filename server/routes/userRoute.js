const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const otpdb = require("../models/otpSchema");
const bcrypt = require("bcryptjs");


const authenticate = require("../middleware/authenticate");

const jwt = require("jsonwebtoken");
const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";

// for user registration

router.post("/register",async(req,res)=>{
    console.log("1");
    const {userName, email, password, confirmPassword, otp} = req.body;
    console.log(req.body);
    if(!userName || !email || !password || !confirmPassword || !otp){
       return res.status(422).json({error:"fill all the details"});
    }
    try{

       const preuser= await userdb.findOne({email:email});
        console.log(preuser);
       if(preuser){
        res.status(422).json({error:"user already exist"});
       }
       else if (password!=confirmPassword){
        res.status(422).json({error:"password is not matched"});
       }
       else {
        console.log("i m going to get otp");
        const otpUser = await otpdb.findOne({email:email});
        console.log(otpUser);
        if(!otpUser){
            res.status(422).json({status:422,message:"otp is not fill"});
        }
        else if(otpUser.otp != otp){
            res.status(422).json({status:422,message:"otp is incorrect"});
        }

        const finaluser=new userdb({
            userName,email,password,confirmPassword
        })

        const storedata= await finaluser.save();
        const token = await storedata.generateAuthToken();
               
                res.cookie("usercookie",token,{
                    expires : new Date(Date.now()+9000000),
                    httpOnly : true
                })

                const result={
                    storedata,
                    token
                }
       
        res.status(201).json(result);
       }
    }
    catch(errr){
        res.status(422).json({error:"some error occured"});
    }
})


// for user login

router.post("/login",async(req,res)=>{
   
    const {email,password} = req.body;
    
    if(! email || !password){
        res.status(422).json({error:"please enter reqyired field"});
    }

    try{
       
        const uservalid= await userdb.findOne({email:email});
        
        if(uservalid){

            const isvalid = await bcrypt.compare(password,uservalid.password);
           
            if(!isvalid){
                res.status(422).json({error:"invalid details"});
            }
            else{
               
                const token = await uservalid.generateAuthToken();
               
                res.cookie("usercookie",token,{
                    expires : new Date(Date.now()+9000000),
                    httpOnly : true
                })

                const result={
                    uservalid,
                    token
                }
                res.status(201).json(result);
            }

        }

    }
    catch(error){
        res.status(422).json({status:422,error:"user not found"})
    }
})

// for token validation

router.get("/validuser",authenticate,async(req,res)=>{
   try{
    const validuserone = await userdb.findOne({_id:req.userId}) || await googledb.findOne({_id:req.userId});
    res.status(201).json({status:201,validuserone});
   }
   catch(error){
    res.status(401).json({status:401,message:"user not found"});
   }
})

router.get("/logout", authenticate, async (req, res) => {
    try {
      // 1. Handle JWT Logout: Remove token from user's tokens array
      req.rootuser.tokens = req.rootuser.tokens.filter((currelem) => {
        return currelem.token !== req.token;

      });
      res.clearCookie("usercookie", { path: "/" });
      // 2. Save the updated user document
      await req.rootuser.save();
  
      res.status(200).json({ status:200,message: "Logged out successfully", tokens: req.rootuser });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(401).json({ status: 401, error });
    }
  });
  

module.exports=router;