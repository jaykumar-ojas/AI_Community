const { llmConfig } = require('./config/modelconfig'); // Update path
const { uploadImageFromUrl } = require('./middleware/awsmiddleware'); // Update path
const AiModel = require('./models/aimodels'); // Update path
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Provider display names mapping
const providerNames = {
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  grok: "Grok",
  qwen: "Qwen",
  flux: "Flux AI",
  stable: "Stability AI",
  runway: "Runway ML",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  xai: "xAI",
};

// Provider icon URLs mapping (all models from a provider share same icon)
const providerIcons = {
  openai: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/chatgpt-icon.png",
  google: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.62.0/files/dark/gemini-color.png",
  meta: "https://custom.typingmind.com/assets/models/llama.png",
  grok: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/grok-icon.png",
  qwen: "https://crystalpng.com/wp-content/uploads/2025/02/Qwen-04-150x150.png",
  flux: "https://tjzk.replicate.delivery/models_organizations_avatar/01ed70be-0d47-4a4a-85fb-32c02cdd4ab5/bfl.png",
  stable: "https://custom.typingmind.com/assets/models/stability.png",
  runway: "https://images.seeklogo.com/logo-png/49/1/runway-logo-png_seeklogo-496519.png",
  anthropic: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.49.0/files/dark/claude-color.png",
  deepseek: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.62.0/files/dark/deepseek-color.png",
  xai: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/grok-icon.png",
};

// Upload all models (text + image) to DB
const uploadModels = async () => {
  try {
    console.log("Starting model upload...");

    // Connect MongoDB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
    }

    const modelsToProcess = [];

    // Flatten text models
    for (const [provider, models] of Object.entries(llmConfig.text)) {
      for (const modelName of Object.keys(models)) {
        modelsToProcess.push({
          modelName,
          providerName: providerNames[provider] || provider,
          providerKey: provider,
          type: "text",
        });
      }
    }

    // Flatten image models
    for (const [provider, models] of Object.entries(llmConfig.image)) {
      for (const modelName of Object.keys(models)) {
        modelsToProcess.push({
          modelName,
          providerName: providerNames[provider] || provider,
          providerKey: provider,
          type: "image",
        });
      }
    }

    console.log(`Found ${modelsToProcess.length} models to process`);

    for (const model of modelsToProcess) {
      try {
        console.log(`Processing model: ${model.modelName}`);

        // Skip if already exists
        const exists = await AiModel.findOne({ modelName: model.modelName });
        if (exists) {
          console.log(`⏭️ Skipped: ${model.modelName} (already exists)`);
          continue;
        }

        let uploadedIconUrl = "";

        // Upload provider icon (all models share same provider icon)
        const iconUrl = providerIcons[model.providerKey] || "https://via.placeholder.com/64x64?text=AI";
        try {
          const uploadResult = await uploadImageFromUrl(iconUrl);
          uploadedIconUrl = uploadResult.fileUrl;
        } catch (err) {
          console.error(`Failed to upload icon for ${model.modelName}:`, err.message);
          uploadedIconUrl = "https://via.placeholder.com/64x64?text=AI";
        }

        // Save model
        const newModel = new AiModel({
          modelName: model.modelName,
          providerName: model.providerName,
          iconUrl: uploadedIconUrl,
          type: model.type,
        });

        await newModel.save();
        console.log(`✅ Saved: ${model.modelName}`);
      } catch (err) {
        console.error(`❌ Failed: ${model.modelName} - ${err.message}`);
      }
    }

    console.log("🎉 Model upload completed!");
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  }
};

// Run directly
if (require.main === module) {
  uploadModels();
}

module.exports = { uploadModels };
