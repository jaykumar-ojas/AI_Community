const express = require('express');
const multer = require('multer');
const crypto = require("crypto");
const sharp = require("sharp");
const axios = require('axios');

const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const dotenv = require('dotenv');
dotenv.config();

// Generate a random filename
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
    storage,
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type. Only images, videos, and audio files are allowed."), false);
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        fieldSize: 50 * 1024 * 1024
    } 
});

// ------------------- AWS Upload Middleware -------------------

const awsuploadMiddleware = async (req, res, next) => {
    try {
        let allFiles = [];

        if (req.file) allFiles = [req.file];
        else if (Array.isArray(req.files)) allFiles = req.files;
        else if (req.files && typeof req.files === 'object') allFiles = Object.values(req.files).flat();

        if (allFiles.length === 0) return next();

        req.uploadedFiles = [];

        for (const file of allFiles) {
            const fileType = file.mimetype.split("/")[0];
            let buffer;
            let uploadFileName;
            let contentType = file.mimetype;

            if (fileType === "image") {
                try {
                    // Convert all images to WebP and resize
                    buffer = await sharp(file.buffer)
                        .resize({ width: 800, fit: "inside" }) // adjust width as needed
                        .webp({ quality: 80 })
                        .toBuffer();

                    uploadFileName = `${randomFileName()}.webp`;
                    contentType = "image/webp";
                } catch (err) {
                    console.error("Sharp image processing error:", err);
                    buffer = file.buffer;
                    uploadFileName = `${randomFileName()}.webp`;
                    contentType = "image/webp";
                }
            } else {
                buffer = file.buffer;
                uploadFileName = randomFileName();
            }

            // Parallel multipart upload
            const parallelUpload = new Upload({
                client: s3,
                params: {
                    Bucket: bucketName,
                    Key: uploadFileName,
                    Body: buffer,
                    ContentType: contentType,
                },
                queueSize: 5,
                partSize: 5 * 1024 * 1024,
                leavePartsOnError: false,
            });

            await parallelUpload.done();

            const fileUrl = await generateSignedUrl(uploadFileName);

            req.uploadedFiles.push({
                fileName: uploadFileName,
                originalField: file.fieldname,
                fileType: contentType,
                fileUrl,
                fileSize: buffer.length,
                uploadedAt: new Date(),
            });
        }

        next();
    } catch (error) {
        console.error("Error uploading files:", error);
        return res.status(500).json({ status: 500, error: error.message });
    }
};

// ------------------- Generate Signed URL -------------------

const generateSignedUrl = async (key) => {
    if (!key) return "";
    return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
};

// ------------------- Delete from S3 -------------------

const awsdeleteMiddleware = async (key) => {
    try {
        const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
        const result = await s3.send(command);
        console.log("Deleted S3 file:", key);
        return true;
    } catch (error) {
        console.error("Error deleting S3 file:", key, error);
        return false;
    }
};

// ------------------- Upload Image from URL -------------------

const uploadImageFromUrl = async (imageUrl) => {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = await sharp(response.data)
            .resize({ width: 800, fit: "inside" })
            .webp({ quality: 80 })
            .toBuffer();

        const fileName = `${randomFileName()}.webp`;

        const parallelUpload = new Upload({
            client: s3,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: buffer,
                ContentType: "image/webp",
            },
            queueSize: 5,
            partSize: 5 * 1024 * 1024,
        });

        await parallelUpload.done();

        const fileUrl = await generateSignedUrl(fileName);

        return {
            fileName,
            fileType: "image/webp",
            fileUrl,
            fileSize: buffer.length,
            uploadedAt: new Date(),
        };
    } catch (error) {
        console.error("Error uploading image from URL:", error);
        throw error;
    }
};

// ------------------- Upload Image from Blob -------------------

const uploadImageFromBlob = async (blob, fileName = null) => {
    try {
        const buffer = await sharp(Buffer.from(blob, "base64"))
            .resize({ width: 800, fit: "inside" })
            .webp({ quality: 80 })
            .toBuffer();

        const generatedFileName = fileName || `${randomFileName()}.webp`;

        const parallelUpload = new Upload({
            client: s3,
            params: {
                Bucket: bucketName,
                Key: generatedFileName,
                Body: buffer,
                ContentType: "image/webp",
            },
            queueSize: 5,
            partSize: 5 * 1024 * 1024,
        });

        await parallelUpload.done();

        const fileUrl = await generateSignedUrl(generatedFileName);

        return {
            fileName: generatedFileName,
            fileType: "image/webp",
            fileUrl,
            fileSize: buffer.length,
            uploadedAt: new Date(),
        };
    } catch (error) {
        console.error("Error uploading blob to S3:", error);
        throw error;
    }
};

module.exports = {
    generateSignedUrl,
    awsuploadMiddleware,
    awsdeleteMiddleware,
    uploadImageFromUrl,
    uploadImageFromBlob
};
