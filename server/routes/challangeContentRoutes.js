const express = require('express');
const router = new express.Router();
const DailyChallangeDb = require("../models/dailyChallangeSchema");
const WeekelyChallangeDb = require("../models/weeklyChallangeSchema");
const { awsuploadMiddleware } = require('../middleware/awsmiddleware');
const multer = require('multer');
const Challenge = require("../models/challangeSchema");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images, videos, and audio files
    if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype.startsWith('audio/')
    ) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Only images, videos, and audio files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});



router.post("/challenges/data", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id is required in body" });
    console.log("i come here for getting challenge data");
    // find by challangeId field in your schema
    const doc = await DailyChallangeDb.find({challangeId: id});
    if (!doc) return res.status(404).json({ message: "Challenge data not found" });
    console.log("i get my data for challenge");
    console.log("doc ::",doc);
    return res.status(200).json({ data: doc });
  } catch (err) {
    console.error("POST /challenges/data error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post(
  "/upload-image-challenge",
  upload.single("file"),
  awsuploadMiddleware,
  async (req, res) => {
    try {
      const { userId, challengeId, desc, aiModel, aiProvider, aiPrompt } = req.body;

      // Basic validation
      if (!userId) {
        return res.status(401).json({ status: 401, error: "User not logged in" });
      }
      if (!challengeId) {
        return res.status(400).json({ status: 400, error: "No existing challengeId provided" });
      }

      const challengeDoc = await Challenge.findById(challengeId);

      if(!challengeDoc){
        return res.status(400).json({status:400, error:"no existing challenge"});
      }

      // uploadedFiles expected to be set by awsuploadMiddleware
      if (!req.uploadedFiles || !Array.isArray(req.uploadedFiles) || req.uploadedFiles.length === 0) {
        return res.status(400).json({ status: 400, error: "No file uploaded" });
      }

      const uploadedFile = req.uploadedFiles[0];

      if (!uploadedFile.fileName || !uploadedFile.fileUrl) {
        console.error("Uploaded file missing fileName or fileUrl:", uploadedFile);
        return res.status(422).json({ status: 422, error: "File processing failed - incomplete file data" });
      }

      // Determine high-level file type (image/video/audio) and basic meta
      const mime = uploadedFile.fileType || ""; // e.g. 'image/png'
      const fileTypeTop = mime.split("/")[0] || "unknown";

      const imageUrlObj = {
        fileName: uploadedFile.fileName,
        fileType: fileTypeTop,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize || 0,
        uploadedAt: new Date(),
      };

      // Build document for DailyChallengeDb (matching schema fields)
      const doc = new DailyChallangeDb({
        challangeId: challengeId,
        userId: userId,
        text: desc || "",
        imageUrl: imageUrlObj,
        aiModel: aiModel || undefined,
        aiProvider: aiProvider || undefined,
        aiPrompt: aiPrompt || undefined,
        aiGeneratedAt: aiPrompt ? new Date() : undefined,
        likes: [],
      });

      const saved = await doc.save();

      challengeDoc.completedBy.push(userId);
      await challengeDoc.save();
      console.log("successfully saved");
      return res.status(201).json({ status: 201, data: saved });
    } catch (error) {
      console.error("Error in /upload-image-challange:", error);
      const message = error && error.message ? error.message : "Unknown error";
      return res.status(500).json({ status: 500, error: message });
    }
  }
);












module.exports = router;