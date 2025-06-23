const express = require('express');
const router = new express.Router();

const notificationDb = require("../models/notificationSchema");
const authenticate = require('../middleware/authenticate');

router.get('/getNotification/:userId',authenticate,async(req,res)=>{
    try{
        console.log("i m coming to notification")
        const userId = req.params.userId;
        console.log(userId);
        console.log("i m going to notification")
        const notification = await notificationDb.find({"userId": userId});
        console.log("sending to backend",notification);
        res.status(200).json({status:200,data:notification});
    }
    catch(error){
        console.log("the error come during fetch",error);
    }
   

})

module.exports = router;