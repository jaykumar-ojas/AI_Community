const express = require('express')
const multer = require('multer')
const crypto = require("crypto");
const sharp = require("sharp");

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");



const dotenv = require('dotenv');
dotenv.config();

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.BUCKET;
const bucketRegion = process.env.REGION;
const accessKey = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
console.log("Using AWS region:", bucketRegion);
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

router.get("/api/posts/:id", async (req, res) => {


    const getObjectParams = {
        Bucket: bucketName,
        Key: req.params.id,
    }
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.send(url);
    
})


router.post("/api/posts", upload.single('image'), async (req, res) => {
    

    // resize image
    const buffer = await sharp(req.file.buffer).resize({ height: 1920, width: 1080, fit: "contain" }).toBuffer()
    try{
        console.log("i am going to save in aws");
        const imageName = randomImageName();
        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: buffer,
            ContentType: req.file.mimetype,
        }

        const command = new PutObjectCommand(params);
        console.log("i am going to send in aws");
        console.log(bucketName);
        console.log(bucketRegion);
        console.log(accessKey);
        console.log(secretAccessKey);
        await s3.send(command)
        console.log("i am going to sedn in backend");
        res.status(201).json({status:201,imageName});
        console.log(' here everything is ok');
    }
    catch(error){
        console.error("Error uploading image:", error);
        res.status(500).send("Error uploading image.");
    }
})

router.delete("/api/posts/:id", async (req, res) => {
    // const id = +req.params.id;

    const params = {
        Bucket: bucketName,
        Key: req.params.id,
    }
    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    res.send("ok image deleted");
})


module.exports=router;