const express = require('express')
const multer = require('multer')
const crypto = require("crypto");
const sharp = require("sharp");

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dotenv = require('dotenv');
const { stat } = require('fs');
dotenv.config();

// Generate a random filename for any file type
const randomFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

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
const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/mkv',
    'video/webm',
    'video/quicktime',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm'
];

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log("MIME Type:", file.mimetype);
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type. Only images, videos, and audio files are allowed."), false);
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

const awsuploadMiddleware = async (req, res, next) => {
    console.log("Processing file upload");
    try {
        if (!req.files || req.files.length === 0) {
            return next(); // No files to process, continue to next middleware
        }

        req.uploadedFiles = []; // Array to store processed file information

        for (const file of req.files) {
            const fileType = file.mimetype.split('/')[0]; // 'image', 'video', or 'audio'
            let buffer;

            // Process images with sharp, leave videos and audio as is
            if (fileType === 'image') {
                try {
                    buffer = await sharp(file.buffer)
                        .resize({ height: 1920, width: 1080, fit: "contain" })
                        .toBuffer();
                } catch (sharpError) {
                    console.error("Error processing image with sharp:", sharpError);
                    // Fallback to original buffer if sharp fails
                    buffer = file.buffer;
                }
            } else {
                buffer = file.buffer; // For videos and audio, use the original buffer
            }

            const fileName = randomFileName();
            console.log("Generated file name:", fileName);
            
            const params = {
                Bucket: bucketName,
                Key: fileName,
                Body: buffer,
                ContentType: file.mimetype,
            };
            console.log("Uploading to S3 bucket");

            const command = new PutObjectCommand(params);
            await s3.send(command);
            console.log("File uploaded successfully");

            // Generate signed URL for the uploaded file
            const fileUrl = await generateSignedUrl(fileName);
            console.log("Generated signed URL:", fileUrl);

            // Store file information
            req.uploadedFiles.push({
                fileName,
                fileType: file.mimetype,
                fileUrl,
                fileSize: file.size,
                uploadedAt: new Date()
            });
        }

        next();
    } catch (error) {
        console.error("Error uploading file:", error);
        return res.status(500).json({ status: 500, error: "Error uploading file: " + error.message });
    }
};

const generateSignedUrl = async(keys)=>{
    try{
        const getObjectParams = {
            Bucket: bucketName,
            Key: keys,
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 * 24 * 7 }); // URL valid for 7 days
        return url;
    }catch (error) {
        console.error("Error generating signed URL:", error);
        throw new Error("failed to generate signed url");
    }
}

const awsdeleteMiddleware = async(key) => {
    try {
        console.log("Attempting to delete file from S3:", key);
        
        const params = {
            Bucket: bucketName,
            Key: key,
        };
        
        const command = new DeleteObjectCommand(params);
        const result = await s3.send(command);
        
        console.log("File deleted successfully from S3:", key);
        console.log("Delete result:", result);
        
        return true;
    } catch(error) {
        console.error("Error deleting file from S3:", error);
        console.error("File key:", key);
        // Don't throw the error, just return false to indicate failure
        return false;
    }
};

module.exports={
    generateSignedUrl,
    awsuploadMiddleware,
    awsdeleteMiddleware
};