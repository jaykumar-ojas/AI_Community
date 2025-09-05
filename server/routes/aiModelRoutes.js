const express = require("express");
const router = express.Router();
const AiModel = require("../models/aimodels");

// GET /api/aimodels/search?modelName=modelName
// Search for AI model by name and return all fields
router.get("/aimodels/search", async (req, res) => {
  try {
    const { modelName } = req.query;

    // Check if modelName is provided
    if (!modelName) {
      return res.status(400).json({
        success: false,
        message: "Model name is required as a query parameter"
            });
    }

    // Search for the model (case-insensitive search)
    const model = await AiModel.findOne({
      modelName: { $regex: modelName, $options: 'i' }
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: `No AI model found with name: ${modelName}`
      });
    }

    // Return the model with all fields
    res.status(200).json({
      success: true,
      message: "AI model found successfully",
      data: {
        modelName: model.modelName,
        providerName: model.providerName,
        iconUrl: model.iconUrl
      }
    });

  } catch (error) {
    console.error("Error searching for AI model:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});



module.exports = router; 