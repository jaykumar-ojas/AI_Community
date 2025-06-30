const express = require("express");
const router = new express.Router();
const axios = require('axios');
const mongoose = require('mongoose');

const {
    openai,
    model,
    promptEnhancer,
    promptEnhancerAI,
    imageToText,
    textSuggestion,
    imageGenerator,
    fetchAncestorContext,
    formatContextForAI,
    generateTextResponse,
    addImageDescriptions,
    handleImageDescriptionRequest,
    describeImage,
    getFirstNWords,
    extractContentText,
    extractMediaDescriptions,
    textSuggestionWithContext
} = require("../middleware/LLMmiddleware");

router.post('/suggest/:id', (req, res, next) => {
  // Set the contextType for the middleware
 // req.body.contextType = 'forumReply';
 console.log("context type is ", req.body.contextType);
  next();
}, fetchAncestorContext, async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for AI suggestion'
      });
    }

    const ancestorContext = req.ancestorContext;
    const ancestorMedia = req.ancestorMedia;

    // Generate AI suggestion with context
    const result = await textSuggestionWithContext(text, ancestorContext, ancestorMedia, options);

    res.json({
      success: true,
      data: {
        suggestion: result,
        metadata: result.metadata,
        context: {
          totalNodes: ancestorContext?.summary?.totalNodes || 0,
          depthReached: ancestorContext?.summary?.depthReached || 0,
          mediaCount: ancestorMedia?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in forum AI suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI suggestion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post("/aitest", async (req, res) => {
  console.log("Request body: outside try in after middleware", req.body);
  try {
    const prompt = req.updatedPrompt;

    if (!prompt) {
      console.error(
        "Middleware 'promptEnhancer' failed to add ''updatedprompt"
      );
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ status: 500, error: "promptenhancement step failed" });
      }

      return;
    }

    console.log("recived enhanced prompt ", prompt);
    const url = await imageGenerator(prompt);
    res.status(200).json({
      status: 200,
      prompt: prompt,
      url: url,
    });
  } catch (error) {
    console.error("Error in route handler:", error);
    res.status(500).json({ status: 500, error: "Internal server error" });
  }
});



// New route for generating forum topic content
router.post("/generateTopicContent", async (req, res) => {
  try {
    const { prompt, modelName = "gemini-2.0-flash" } = req.body;
    if (!prompt) {
      return res.status(400).json({ status: 400, error: "Prompt is required" });
    }

    const final_Prompt = `Generate a forum topic based on the folowing idea: "${prompt}" .
    
    Please provide the output in this format:
    Title: [Generated Title Here]
    
    [Generated detailed forum post content here]`;

    console.log("sending prompt to AI for the topic gneration: ", final_Prompt);

    const result = await model.generateContent(final_Prompt);
    const generatedText = result.response.text();
    console.log("Recived raw responce from AI: ", generatedText);

    let title = `AI TOPIC: ${prompt.substring(0, 40)} ...`;
    let body = generatedText;

    const lines = generatedText.split("\n");
    const titleLineIndex = lines.findIndex((line) =>
      line.toLowerCase().startsWith("title:")
    );

    if (titleLineIndex !== -1) {
      title = lines[titleLineIndex].substring(6).trim();

      //Findstart
      let bodyStartIndex = titleLineIndex + 1;
      while (
        bodyStartIndex < lines.length &&
        lines[bodyStartIndex].trim() === ""
      ) {
        bodyStartIndex++;
      }
      body = lines.slice(bodyStartIndex).join("\n").trim();
    } else {
      console.warn(
        "AI response format might not contains 'Title:: useing default"
      );
    }

    // Generate an image based on the topic
    const imagePrompt = `Create a visually appealing image that represents: ${title}`;
    const imageUrl = await imageGenerator(imagePrompt);

    // Get AI model information
    let modelInfo = null;
    try {
      const AiModel = require('../models/aimodels');
      const modelData = await AiModel.findOne({
        modelName: { $regex: modelName, $options: 'i' }
      });
      
      if (modelData) {
        modelInfo = {
          modelName: modelData.modelName,
          providerName: modelData.providerName,
          iconUrl: modelData.iconUrl
        };
      }
    } catch (modelError) {
      console.error("Error fetching model info:", modelError);
      // Continue without model info if there's an error
    }

    // Return both the content and the generated image
    res.status(200).json({
      status: 200,
      content: {
        title: title,
        body: body,
        imageUrl: imageUrl
      },
      modelInfo: modelInfo
    });
  } catch (error) {
    console.error("Error generating topic content:", error);
    res
      .status(500)
      .json({ status: 500, error: "Failed to generate topic content" });
  }
});

// New route for generating AI responses to forum topics
router.post("/generateTopicResponse", async (req, res) => {
  try {
    const { topicContent, userMessages } = req.body;

    if (!topicContent) {
      return res
        .status(400)
        .json({ status: 400, error: "Topic content is required" });
    }

    // Combine topic content with user messages for context
    const contextPrompt = `
      Topic: ${topicContent}
      ${userMessages ? `User's question/comment: ${userMessages}` : ""}
      Please provide a helpful and engaging response that adds value to this discussion.
    `;

    // Use the text suggestion function for generating responses
    const aiResponse = await textSuggestion(contextPrompt);

    if (!aiResponse) {
      throw new Error("Failed to generate AI response");
    }

    res.status(200).json({
      status: 200,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({
      status: 500,
      error:
        error.message || "Failed to generate AI response. Please try again.",
    });
  }
});



router.put("/describe-images/:objectId", handleImageDescriptionRequest);

// global router for model selection
// here we have to select model
// router.post("/global-route",async(req,res)=>{

router.post("/stateselection", async (req, res) => {
  try {
    // Extract the text prompt and control bits from the request
    const { textPrompt, controlBits = {}, contextType, entityId } = req.body;
    console.log(textPrompt);
    if (!textPrompt) {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    // Initialize the result object to track transformations
    let result = {
      originalPrompt: textPrompt,
      currentText: textPrompt,
      enhancedPrompt: null,
      generatedText: null,
      generatedImage: null,
      generatedImageUrl: null,
      contextAwareResponse: null,
      processingSteps: [],
    };
    // Step 4: Context-Aware Request Processing (if bit is on)
    if (controlBits.processContextAware) {
      try {
        // Modified to work with your context-aware processing
        if (!req.ancestorContext && entityId && contextType) {
          // Create a temporary request and response object to use with fetchAncestorContext
          const tempReq = {
            params: { id: entityId },
            body: { contextType },
          };

          const contextResults = {};
          let contextError = null;

          // Create a temporary response object to capture the response
          const tempRes = {
            status: (code) => {
              contextResults.statusCode = code;
              return {
                json: (data) => {
                  contextResults.data = data;
                },
              };
            },
          };

          // Create a temporary next function
          const tempNext = (error) => {
            if (error) {
              contextError = error;
            }
          };

          // Run the fetch ancestor context middleware
          await fetchAncestorContext(tempReq, tempRes, tempNext);

          if (contextError || !tempReq.ancestorContext) {
            console.error(
              "Failed to fetch ancestor context:",
              contextError || "No context returned"
            );
          } else {
            // Format the context for the AI
            const formattedContext = formatContextForAI(
              tempReq.ancestorContext
            );

            // Analyze request type
            const requestType = analyzeRequestType(result.currentText);

            let contextResult;

            if (requestType === "IMAGE_REQUEST") {
              // Extract what the image should be of
              const imageDescription = await extractImageDescription(
                formattedContext,
                result.currentText
              );

              // Use existing imageGenerator function to generate the image
              const imageUrl = await imageGenerator(
                imageDescription || result.currentText
              );

              contextResult = {
                type: "image",
                imageUrl: imageUrl,
                description: imageDescription,
              };
            } else {
              // Generate text response
              const textResponse = await generateTextResponse(
                formattedContext,
                result.currentText
              );

              contextResult = {
                type: "text",
                content: textResponse,
              };
            }

            result.contextAwareResponse = contextResult;
            result.currentText =
              contextResult.type === "text"
                ? contextResult.content
                : result.currentText;
          }
        } else {
          console.log("Skipping context fetch - insufficient parameters");
        }

        result.processingSteps.push("contextAwareProcessing");
      } catch (error) {
        console.error("Error in context-aware processing:", error);
        result.processingSteps.push("contextAwareProcessing (failed)");
      }
    }
    // Step 1: Prompt Enhancement (if bit is on)
    if (controlBits.enhancePrompt) {
      try {
        // Using the promptEnhancerAI from your middleware
        result.enhancedPrompt = await promptEnhancerAI(textPrompt);
        result.currentText = result.enhancedPrompt;
        result.processingSteps.push("promptEnhancerAI");
      } catch (error) {
        console.error("Error in prompt enhancement:", error);
        // Continue with the original text if enhancement fails
        result.processingSteps.push("promptEnhancerAI (failed)");
      }
    }

    // Step 2: Text Generation (if bit is on)
    if (controlBits.generateText) {
      try {
        // Using the textSuggestion from your middleware
        result.generatedText = await textSuggestion(result.currentText);
        result.currentText = result.generatedText;
        result.processingSteps.push("textSuggestion");
      } catch (error) {
        console.error("Error in text generation:", error);
        result.processingSteps.push("textSuggestion (failed)");
      }
    }

    // Step 3: Image Generation (if bit is on)
    if (controlBits.generateImage) {
      try {
        // Using the imageGenerator from your middleware
        const imageUrl = await imageGenerator(result.currentText);
        result.generatedImageUrl = imageUrl;

        // Optionally download the image and upload to S3 if needed
        // if (imageUrl && controlBits.storeImages) {
        //   const imageBuffer = await downloadImage(imageUrl);
        //   const s3Url = await uploadToS3(imageBuffer);
        //   result.generatedImage = s3Url;
        // } else {
        //   result.generatedImage = imageUrl;
        // }

        result.processingSteps.push("imageGenerator");
      } catch (error) {
        console.error("Error in image generation:", error);
        result.processingSteps.push("imageGenerator (failed)");
      }
    }

    // Return the final result with all processing information
    return res.status(200).json({
      success: true,
      result: result,
    });
  } catch (error) {
    console.error("Error in state selection API:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while processing your request",
      details: error.message,
    });
  }
});

// });

// Image Generator API Route
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: 400,
        error: "Prompt is required for image generation"
      });
    }

    // Generate image using the existing imageGenerator middleware
    const imageUrl = await imageGenerator(prompt);

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    res.status(200).json({
      status: 200,
      imageUrl: imageUrl,
      prompt: prompt
    });

  } catch (error) {
    console.error("Error in image generation:", error);
    res.status(500).json({
      status: 500,
      error: error.message || "Failed to generate image"
    });
  }
});

// Add proxy endpoint for cors issue
router.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Validate that imageUrl is a string and looks like a URL
    if (typeof imageUrl !== 'string') {
      console.error("Invalid imageUrl type:", typeof imageUrl, imageUrl);
      return res.status(400).json({ error: "Image URL must be a string" });
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.error("Invalid imageUrl format:", imageUrl);
      return res.status(400).json({ error: "Image URL must be a valid HTTP/HTTPS URL" });
    }

    console.log("Proxying image from URL:", imageUrl);

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    //image data
    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);

    res.send(response.data);
  } catch (error) {
    console.error("Error proxying image:", error);
    if (error.code === 'ERR_INVALID_URL') {
      res.status(400).json({ error: "Invalid image URL provided" });
    } else {
      res.status(500).json({ error: "Failed to fetch image" });
    }
  }
});

// New route for enhancing prompts
router.post("/enhance-prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("i am in the ehnace route");
    if (!prompt) {
      return res.status(400).json({
        status: 400,
        error: "Prompt is required for enhancement"
      });
    }

    // Use the existing promptEnhancerAI middleware function
    const enhancedPrompt = await promptEnhancerAI(prompt);
    console.log('enhaqncing gn',enhancedPrompt);

    if (!enhancedPrompt) {
      throw new Error("Failed to enhance prompt");
    }

    console.log('i am going to send the ence promtp');

    res.status(200).json({
      status: 200,
      enhancedPrompt: enhancedPrompt,
      originalPrompt: prompt
    });
  } catch (error) {
    console.error("Error in prompt enhancement:", error);
    res.status(500).json({
      status: 500,
      error: error.message || "Failed to enhance prompt"
    });
  }
});

router.get('/forum/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json', maxDepth = 10, maxWords = 50 } = req.query;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing forum reply ID'
      });
    }

    // Set up request object for middleware
    req.params.id = id;
    req.body.contextType = 'forumReply';
    req.body.maxDepth = parseInt(maxDepth);
    req.body.maxWords = parseInt(maxWords);

    // Use middleware to fetch context
    await new Promise((resolve, reject) => {
      fetchAncestorContext(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const ancestorContext = req.ancestorContext;
    const ancestorMedia = req.ancestorMedia;

    // Format response based on requested format
    let response = {
      success: true,
      data: {
        id: id,
        contextType: 'forumReply',
        context: ancestorContext,
        media: ancestorMedia,
        timestamp: new Date().toISOString()
      }
    };

    if (format === 'ai') {
      response.data.aiFormattedContext = formatContextForAI(ancestorContext);
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching forum context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ancestor context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/comment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json', maxDepth = 10, maxWords = 50 } = req.query;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing comment ID'
      });
    }

    // Set up request object for middleware
    req.params.id = id;
    req.body.contextType = 'comment';
    req.body.maxDepth = parseInt(maxDepth);
    req.body.maxWords = parseInt(maxWords);

    // Use middleware to fetch context
    await new Promise((resolve, reject) => {
      fetchAncestorContext(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const ancestorContext = req.ancestorContext;
    const ancestorMedia = req.ancestorMedia;

    // Format response
    let response = {
      success: true,
      data: {
        id: id,
        contextType: 'comment',
        context: ancestorContext,
        media: ancestorMedia,
        timestamp: new Date().toISOString()
      }
    };

    if (format === 'ai') {
      response.data.aiFormattedContext = formatContextForAI(ancestorContext);
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching comment context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ancestor context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
