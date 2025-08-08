const express = require("express");
const router = new express.Router();

const {openai, model, describeImage, imageToText,promptEnhancer,imageGenerator,promptEnhancerAI, textSuggestion, fetchAncestorContext, processContextAwareRequest, upload, fileFilter, downloadImage, uploadToS3 } = require('../middleware/LLMmiddleware');


router.post("/stateselection", )