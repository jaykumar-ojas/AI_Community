const express = require('express');
const multer = require('multer');
const crypto = require("crypto");
const sharp = require("sharp");
const axios = require('axios');

const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dotenv = require('dotenv');
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
    'image/jpg',
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
        fileSize: 50 * 1024 * 1024,
        fieldSize: 50 * 1024 * 1024  // 50MB limit
    } 
});

const awsuploadMiddleware = async (req, res, next) => {
    console.log("Middleware triggered. Single file:", req.file);

    try {
        let allFiles = [];

        // Support for upload.single()
        if (req.file) {
            allFiles = [req.file];
        }

        // Support for upload.array()
        else if (Array.isArray(req.files)) {
            allFiles = req.files;
        }

        // Support for upload.fields()
        else if (req.files && typeof req.files === 'object') {
            allFiles = Object.values(req.files).flat();
        }

        if (allFiles.length === 0) {
            console.log("No files to process");
            return next();
        }

        req.uploadedFiles = [];

        for (const file of allFiles) {
            const fileType = file.mimetype.split("/")[0];
            let buffer;

            if (fileType === "image") {
                try {
                    const image = sharp(file.buffer);
                    const metadata = await image.metadata();

                    if (metadata.width > 1920 || metadata.height > 1080) {
                        buffer = await image
                            .resize({
                                width: metadata.width > 1920 ? 1920 : undefined,
                                height: metadata.height > 1080 ? 1080 : undefined,
                                fit: "inside",
                            })
                            .toBuffer();
                    } else {
                        buffer = await image.toBuffer();
                    }
                } catch (sharpError) {
                    console.error("Error processing image with sharp:", sharpError);
                    buffer = file.buffer;
                }
            } else {
                buffer = file.buffer;
            }

            const fileName = randomFileName();
            console.log("Generated file name:", fileName);

            console.log("Uploading to S3 bucket (multipart parallel upload)");

            const parallelUpload = new Upload({
                client: s3,
                params: {
                    Bucket: bucketName,
                    Key: fileName,
                    Body: buffer,
                    ContentType: file.mimetype,
                },
                queueSize: 5, // concurrency
                partSize: 5 * 1024 * 1024, // 5MB chunks
                leavePartsOnError: false,
            });

            await parallelUpload.done();
            console.log("File uploaded successfully");

            const fileUrl = await generateSignedUrl(fileName);
            console.log("Generated signed URL:", fileUrl);

            req.uploadedFiles.push({
                fileName,
                originalField: file.fieldname,
                fileType: file.mimetype,
                fileUrl,
                fileSize: file.size,
                uploadedAt: new Date(),
            });
        }

        next();
    } catch (error) {
        console.error("Error uploading file:", error);
        return res
            .status(500)
            .json({ status: 500, error: "Error uploading file: " + error.message });
    }
};


const generateSignedUrl = async(keys)=>{
    try{
        if (!keys) {
            console.warn("Warning: Attempted to generate signed URL with empty key");
            return "";
        }

        // Instead of generating presigned, using direct public URL
        return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${keys}`;
    }catch (error) {
        console.error("Error generating signed URL:", error);
        return "https://via.placeholder.com/300?text=Image+Error";
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
        return false;
    }
};

// const uploadImageFromUrl = async (imageUrl) => {
//     try {
//         console.log("Uploading image from URL");
//         const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        
//         const contentType = response.headers['content-type'];
//         if (!allowedMimeTypes.includes(contentType)) {
//             throw new Error("Unsupported file type.");
//         }
        
//         const fileName = `${randomFileName(16)}.${contentType.split('/')[1]}`;
//         console.log("fileName", fileName);

//         const parallelUpload = new Upload({
//             client: s3,
//             params: {
//                 Bucket: bucketName,
//                 Key: fileName,
//                 Body: response.data,
//                 ContentType: contentType,
//             },
//             queueSize: 5,
//             partSize: 5 * 1024 * 1024,
//         });

//         await parallelUpload.done();

//         const fileUrl = await generateSignedUrl(fileName);
//         console.log(`Image uploaded successfully: ${fileName}`);
//         return {
//             fileName : fileName,
//             fileType: "image",
//             fileUrl,
//             fileSize: "",
//             uploadedAt: new Date(),
//         }
//     } catch (error) {
//         console.error("Error uploading image:", error);
//         throw error;
//     }
// };

// const uploadImageFromBlob = async (blob, fileName = null) => {
//   try {
//     const generatedFileName = fileName || `${randomFileName(16)}.png`;
//     const buffer = Buffer.from(blob,"base64");

//     const parallelUpload = new Upload({
//         client: s3,
//         params: {
//             Bucket: bucketName,
//             Key: generatedFileName,
//             Body: buffer,
//             ContentType: "image/png",
//         },
//         queueSize: 5,
//         partSize: 5 * 1024 * 1024,
//     });

//     await parallelUpload.done();

//     const fileUrl = await generateSignedUrl(generatedFileName);

//     return {
//       fileName: generatedFileName,
//       fileType: "image/png",
//       fileUrl,
//       fileSize: buffer.length,
//       uploadedAt: new Date(),
//     };
//   } catch (error) {
//     console.error("Error uploading blob to S3:", error);
//     throw error;
//   }
// };

const uploadImageFromUrl = async (imageUrl) => {
    try {
        console.log("Uploading image from URL");

        // Fetch image as stream instead of full buffer
        const response = await axios.get(imageUrl, { responseType: 'stream' });
        const contentType = response.headers['content-type'];

        if (!allowedMimeTypes.includes(contentType)) {
            throw new Error("Unsupported file type.");
        }

        const fileName = `${randomFileName(16)}.${contentType.split('/')[1]}`;
        console.log("Generated fileName:", fileName);

        // Parallel multipart upload directly from stream
        const parallelUpload = new Upload({
            client: s3,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: response.data,  // stream
                ContentType: contentType,
            },
            queueSize: 5,             // concurrency
            partSize: 5 * 1024 * 1024 // 5MB
        });

        await parallelUpload.done();

        const fileUrl = await generateSignedUrl(fileName);
        console.log(`Image uploaded successfully: ${fileName}`);
        return {
            fileName,
            fileType: contentType,
            fileUrl,
            fileSize: response.headers['content-length'] || "",
            uploadedAt: new Date(),
        };
    } catch (error) {
        console.error("Error uploading image from URL:", error);
        throw error;
    }
};


const uploadImageFromBlob = async (blob, fileName = null) => {
    try {
        const generatedFileName = fileName || `${randomFileName(16)}.png`;

        // Convert base64 blob to buffer
        const buffer = Buffer.from(blob, "base64");

        // Use multipart parallel upload
        const parallelUpload = new Upload({
            client: s3,
            params: {
                Bucket: bucketName,
                Key: generatedFileName,
                Body: buffer,
                ContentType: "image/png",
            },
            queueSize: 5,
            partSize: 5 * 1024 * 1024,
        });

        await parallelUpload.done();

        const fileUrl = await generateSignedUrl(generatedFileName);

        return {
            fileName: generatedFileName,
            fileType: "image/png",
            fileUrl,
            fileSize: buffer.length,
            uploadedAt: new Date(),
        };
    } catch (error) {
        console.error("Error uploading blob to S3:", error);
        throw error;
    }
};



module.exports={
    generateSignedUrl,
    awsuploadMiddleware,
    awsdeleteMiddleware,
    uploadImageFromUrl,
    uploadImageFromBlob
};
