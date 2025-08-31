const { llmConfig } = require('./config/llmConfig'); // Update path
const { uploadImageFromUrl } = require('./middleware/awsmiddleware'); // Update path
const AiModel = require('./models/aimodels'); // Update path
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
// Model icon URLs mapping
const modelIcons = {
    // Text Models
    "grok-3-mini": "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/grok.png",
    "gpt-4.1": "https://registry.npmmirror.com/@lobehub/icons-static-png/1.49.0/files/dark/openai.png",
    "gemini-2.0-flash": "https://registry.npmmirror.com/@lobehub/icons-static-png/1.62.0/files/dark/gemini-color.png",
    "deepseek-chat": "https://registry.npmmirror.com/@lobehub/icons-static-png/1.62.0/files/dark/deepseek-color.png",
    "claude-3-7-sonnet-20250219": "https://registry.npmmirror.com/@lobehub/icons-static-png/1.49.0/files/dark/claude-color.png",
    "llama-3.3-70b-versatile": "https://custom.typingmind.com/assets/models/llama.png",
    "meta-llama/llama-4-scout-17b-16e-instruct": "https://custom.typingmind.com/assets/models/llama.png",
    
    // Image Models
    "dall-e-3": "https://registry.npmmirror.com/@lobehub/icons-static-png/1.49.0/files/dark/openai.png",
    "grok-2-image-1212": "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/grok.png",
    "imagen-3.0-generate-002": "https://registry.npmmirror.com/@lobehub/icons-static-png/1.62.0/files/dark/gemini-color.png",
    "stable-diffusion-xl": "https://custom.typingmind.com/assets/models/stability.png",
    "stable-diffusion-3-5": "https://custom.typingmind.com/assets/models/stability.png",
    "runway-sd": "https://images.seeklogo.com/logo-png/49/1/runway-logo-png_seeklogo-496519.png",
    "flux-schnell": "https://tjzk.replicate.delivery/models_organizations_avatar/01ed70be-0d47-4a4a-85fb-32c02cdd4ab5/bfl.png",
    "flux-dev": "https://tjzk.replicate.delivery/models_organizations_avatar/01ed70be-0d47-4a4a-85fb-32c02cdd4ab5/bfl.png"
};

// Provider display names mapping
const providerNames = {
    "xai": "xAI",
    "openai": "OpenAI",
    "google": "Google",
    "deepseek": "DeepSeek",
    "anthropic": "Anthropic",
    "meta": "Meta",
    "stability": "Stability AI",
    "runway": "Runway ML",
    "flux": "Flux AI"
};

const batchUploadModels = async () => {
    try {
        console.log("Starting batch upload of AI models...");
        
        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log("Connected to MongoDB");
        }

        const modelsToProcess = [];
        
        // Process text models
        for (const [modelName, config] of Object.entries(llmConfig.text)) {
            modelsToProcess.push({
                modelName,
                providerName: providerNames[config.provider] || config.provider,
                iconUrl: modelIcons[modelName] || null,
                type: 'text'
            });
        }
        
        // Process image models
        for (const [modelName, config] of Object.entries(llmConfig.image)) {
            modelsToProcess.push({
                modelName,
                providerName: providerNames[config.provider] || config.provider,
                iconUrl: modelIcons[modelName] || null,
                type: 'image'
            });
        }

        console.log(`Found ${modelsToProcess.length} models to process`);

        const results = {
            success: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        for (const model of modelsToProcess) {
            try {
                console.log(`Processing model: ${model.modelName}`);
                
                // Check if model already exists
                const existingModel = await AiModel.findOne({ modelName: model.modelName });
                if (existingModel) {
                    console.log(`Model ${model.modelName} already exists, skipping...`);
                    results.skipped++;
                    continue;
                }

                let uploadedIconUrl = "";
                
                // Upload icon to AWS S3 if icon URL is provided
                if (model.iconUrl) {
                    try {
                        console.log(`Uploading icon for ${model.modelName}...`);
                        console.log("icon url is", model.iconUrl);
                        const uploadResult = await uploadImageFromUrl(model.iconUrl);
                        uploadedIconUrl = uploadResult.fileUrl;
                        console.log(`Icon uploaded successfully: ${uploadedIconUrl}`);
                    } catch (iconError) {
                        console.error(`Failed to upload icon for ${model.modelName}:`, iconError.message);
                        // Use a default icon URL or empty string
                        uploadedIconUrl = "https://via.placeholder.com/64x64?text=AI";
                    }
                } else {
                    console.log(`No icon URL provided for ${model.modelName}, using placeholder`);
                    uploadedIconUrl = "https://via.placeholder.com/64x64?text=AI";
                }

                // Create new model in database
                const newModel = new AiModel({
                    modelName: model.modelName,
                    providerName: model.providerName,
                    iconUrl: uploadedIconUrl
                });

                await newModel.save();
                console.log(`✅ Successfully saved model: ${model.modelName}`);
                results.success++;

            } catch (error) {
                console.error(`❌ Failed to process model ${model.modelName}:`, error.message);
                results.failed++;
                results.errors.push({
                    modelName: model.modelName,
                    error: error.message
                });
            }
        }

        // Print summary
        console.log("\n=== BATCH UPLOAD SUMMARY ===");
        console.log(`Total models processed: ${modelsToProcess.length}`);
        console.log(`✅ Successfully uploaded: ${results.success}`);
        console.log(`⏭️  Skipped (already exists): ${results.skipped}`);
        console.log(`❌ Failed: ${results.failed}`);
        
        if (results.errors.length > 0) {
            console.log("\n=== ERRORS ===");
            results.errors.forEach(error => {
                console.log(`${error.modelName}: ${error.error}`);
            });
        }

        return results;

    } catch (error) {
        console.error("Batch upload failed:", error);
        throw error;
    }
};

// Function to update existing models with new icons
const updateModelIcons = async () => {
    try {
        console.log("Updating existing model icons...");
        
        const models = await AiModel.find({});
        
        for (const model of models) {
            if (modelIcons[model.modelName]) {
                try {
                    console.log(`Updating icon for ${model.modelName}...`);
                    const uploadResult = await uploadImageFromUrl(modelIcons[model.modelName]);
                    
                    model.iconUrl = uploadResult.fileUrl;
                    await model.save();
                    
                    console.log(`✅ Updated icon for ${model.modelName}`);
                } catch (error) {
                    console.error(`❌ Failed to update icon for ${model.modelName}:`, error.message);
                }
            }
        }
        
        console.log("Icon update completed");
    } catch (error) {
        console.error("Failed to update model icons:", error);
        throw error;
    }
};

// Function to run the batch job
const runBatchJob = async () => {
    try {
        await batchUploadModels();
        //await updateModelIcons();
        console.log("Batch job completed successfully!");
    } catch (error) {
        console.error("Batch job failed:", error);
        process.exit(1);
    } finally {
        // Close MongoDB connection if we opened it
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log("MongoDB connection closed");
        }
    }
};

// Export functions
module.exports = {
    batchUploadModels,
    updateModelIcons,
    runBatchJob
};

// Run batch job if this file is executed directly
if (require.main === module) {
    runBatchJob();
}