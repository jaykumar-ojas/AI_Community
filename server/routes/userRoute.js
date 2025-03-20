const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const otpdb = require("../models/otpSchema");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const authenticate = require("../middleware/authenticate");
const {awsuploadMiddleware, generateSignedUrl, awsdeleteMiddleware} = require("../middleware/awsmiddleware");

const jwt = require("jsonwebtoken");
const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
       if(preuser){
        res.status(422).json({error:"user already exist"});
       }
       else if (password!=confirmPassword){
        res.status(422).json({error:"password is not matched"});
       }
       else {
        const otpUser = await otpdb.findOne({email:email});
        if(!otpUser){
            res.status(422).json({status:422,message:"otp is not fill"});
        }
        else if(otpUser.otp != otp){
            res.status(422).json({status:422,message:"otp is incorrect"});
        }

        const finaluser = new userdb({
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
       
        res.status(201).json({status:201,token:token,validuserone:storedata});
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

                res.status(201).json({status:201,token:token,validuserone:uservalid});
            }
        }
    }
    catch(error){
        res.status(422).json({status:422,error:"user not found"});
    }
})

// for token validation

router.get("/validuser",authenticate,async(req,res)=>{
   try{
    const validuserone = await userdb.findOne({_id:req.userId}) || await googledb.findOne({_id:req.userId});
    
    // Generate URLs for profile picture and background image if they exist
    let profilePictureUrl = "";
    let backgroundImageUrl = "";
    
    if (validuserone.constructor.modelName === "users" && validuserone.profilePicture) {
        profilePictureUrl = await generateSignedUrl(validuserone.profilePicture);
    } else if (validuserone.constructor.modelName === "googleAuth") {
        if (validuserone.profilePicture) {
            profilePictureUrl = await generateSignedUrl(validuserone.profilePicture);
        } else {
            profilePictureUrl = validuserone.image; // Use Google profile image
        }
    }
    
    if (validuserone.backgroundImage) {
        backgroundImageUrl = await generateSignedUrl(validuserone.backgroundImage);
    }
    
    // Add URLs to the response
    const userResponse = {
        ...validuserone._doc,
        profilePictureUrl,
        backgroundImageUrl
    };
    
    res.status(201).json({status:201, validuserone: userResponse});
   }
   catch(error){
    res.status(401).json({status:401, message:"user not found"});
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
      res.status(401).json({ status: 401, error });
    }
  });
  

// Upload profile picture
router.post("/upload-profile-picture", authenticate, upload.single('file'), awsuploadMiddleware, async(req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({status: 401, error: "User not logged in"});
        }
        console.log("- File name from middleware:", req.fileName);
        if (!req.fileName) {
            return res.status(400).json({status: 400, error: "File upload failed - no filename received"});
        }
        const user = await userdb.findOne({_id: req.userId}) || await googledb.findOne({_id: req.userId});
        if (!user) {
            return res.status(404).json({status: 404, error: "User not found"});
        }
        // Delete old profile picture if exists
        if (user.profilePicture) {
            try {
                await awsdeleteMiddleware(user.profilePicture);
            } catch (deleteError) {
                console.error("Error deleting old profile picture:", deleteError);
            }
        } 
        // Update user with new profile picture
        try {
            const updateUser = await userdb.findByIdAndUpdate(
                req.userId,
                { profilePicture: req.fileName, profilePictureUrl: req.fileUrl },
                { new: true }
            ) || await googledb.findByIdAndUpdate(
                req.userId,
                { profilePicture: req.fileName, profilePictureUrl: req.fileUrl },
                { new: true }
            );
            if (!updateUser) {
                return res.status(500).json({ status: 500, error: "Failed to update user profile picture" });
            }            
            console.log("Profile picture updated successfully");
            return res.status(200).json({status: 200,validuserone:updateUser});
        } catch (updateError) {
            console.error("Error updating user profile picture:", updateError);
            return res.status(500).json({status: 500, error: "Failed to update user profile picture"});
        }
    } catch (error) {
        console.error("Error in profile picture upload:", error);
        return res.status(422).json({status: 422, error: error.message || "Unknown error"});
    }
});

// Upload background image
router.post("/upload-background-image", authenticate, upload.single('file'), awsuploadMiddleware, async(req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({status: 401, error: "User not logged in"});
        }

        console.log("Background image upload request received");
        console.log("- File:", req.file ? req.file.originalname : "No file");
        console.log("- File name from middleware:", req.fileName);
        
        if (!req.fileName) {
            return res.status(400).json({status: 400, error: "File upload failed - no filename received"});
        }
        
        // Find user
        const user = await userdb.findOne({_id: req.userId}) || await googledb.findOne({_id: req.userId});
        
        if (!user) {
            return res.status(404).json({status: 404, error: "User not found"});
        }
        
        // Delete old background image if exists
        if (user.backgroundImage) {
            try {
                await awsdeleteMiddleware(user.backgroundImage);
            } catch (deleteError) {
                console.error("Error deleting old background image:", deleteError);
                // Continue with update even if delete fails
            }
        }
        
        // Update user with new background image
        try {
            if (user.constructor.modelName === "users") {
                await userdb.updateOne({_id: req.userId}, {});
            } else {
                await googledb.updateOne({_id: req.userId}, {backgroundImage: req.fileName});
            }

            const updateUser = await userdb.findByIdAndUpdate(
                req.userId,
                { backgroundImage: req.fileName, backgroundImageUrl: req.fileUrl },
                { new: true }
            ) || await googledb.findByIdAndUpdate(
                req.userId,
                { backgroundImage: req.fileName, backgroundImageUr: req.fileUrl },
                { new: true }
            );
            if (!updateUser) {
                return res.status(500).json({ status: 500, error: "Failed to update user profile picture" });
            }            
            console.log("background image updated successfully");
            return res.status(200).json({status: 200,validuserone:updateUser});
        } catch (updateError) {
            console.error("Error updating user background image:", updateError);
            return res.status(500).json({status: 500, error: "Failed to update user background image"});
        }
    } catch (error) {
        console.error("Error in background image upload:", error);
        return res.status(422).json({status: 422, error: error.message || "Unknown error"});
    }
});

// Get user profile picture URL
router.get("/get-profile-picture", authenticate, async(req, res) => {
    try {
        if (!req.userId) {
            throw new Error("User not logged in");
        }
        
        // Find user
        const user = await userdb.findOne({_id: req.userId}) || await googledb.findOne({_id: req.userId});
        
        if (!user) {
            throw new Error("User not found");
        }
        
        let profilePictureUrl = "";
        
        // For regular users
        if (user.constructor.modelName === "users" && user.profilePicture) {
            profilePictureUrl = await generateSignedUrl(user.profilePicture);
        } 
        // For Google users, use either the uploaded profile picture or the Google image
        else if (user.constructor.modelName === "googleAuth") {
            if (user.profilePicture) {
                profilePictureUrl = await generateSignedUrl(user.profilePicture);
            } else {
                profilePictureUrl = user.image; // Use Google profile image
            }
        }
        
        res.status(200).json({status: 200, profilePictureUrl});
    } catch (error) {
        console.error("Error getting profile picture URL:", error);
        res.status(422).json({status: 422, error: error.message || "Unknown error"});
    }
});

// Get user background image URL
router.get("/get-background-image", authenticate, async(req, res) => {
    try {
        if (!req.userId) {
            throw new Error("User not logged in");
        }
        
        // Find user
        const user = await userdb.findOne({_id: req.userId}) || await googledb.findOne({_id: req.userId});
        
        if (!user) {
            throw new Error("User not found");
        }
        
        let backgroundImageUrl = "";
        
        if (user.backgroundImage) {
            backgroundImageUrl = await generateSignedUrl(user.backgroundImage);
        }
        
        res.status(200).json({status: 200, backgroundImageUrl});
    } catch (error) {
        console.error("Error getting background image URL:", error);
        res.status(422).json({status: 422, error: error.message || "Unknown error"});
    }
});

module.exports=router;