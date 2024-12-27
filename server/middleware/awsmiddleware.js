const express = require('express')
const multer = require('multer')
const crypto = require("crypto");
const sharp = require("sharp");

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");



const dotenv = require('dotenv');
const { stat } = require('fs');
dotenv.config();

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.BUCKET;
const bucketRegion = process.env.REGION;
const accessKey = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
});

const router = require("express").Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// router.post("/api/posts", upload.single('image'), async (req, res) => {
const awsuploadMiddleware = async(req,res,next) => {
    // resize image
   
    const buffer = await sharp(req.file.buffer).resize({ height: 1920, width: 1080, fit: "contain" }).toBuffer()
    try{
        const imageName = randomImageName();
        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: buffer,
            ContentType: req.file.mimetype,
        }

        const command = new PutObjectCommand(params);
        await s3.send(command)

        req.imageName = imageName;

        next();
    }
    catch(error){
        res.status(500).send("Error uploading image.");
    }
};

const awsgetMiddleware = async(req,res,next)=>{
    try{
        const getObjectParams = {
            Bucket: bucketName,
            Key: req.params.id,
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        req.url= url;
        next();
    }catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).send("Error generating signed URL.");
    }
}

const awsdeleteMiddleware = async(req,res,next)=>{
    try{
        const params = {
                Bucket: bucketName,
                Key: req.params.id,
            }
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
        next();
    }catch(error){
        res.status(422).json({status:422,error:"failed to delete"});
    }
}



module.exports={
    awsgetMiddleware,
    awsuploadMiddleware,
    awsdeleteMiddleware
};