const express = require("express");
const router = new express.Router();

const {openai, model, describeImage, imageToText,promptEnhancer,imageGenerator,promptEnhancerAI, textSuggestion, fetchAncestorContext, processContextAwareRequest, upload, fileFilter, downloadImage, uploadToS3 } = require('../middleware/LLMmiddleware');


// there no uploading feature
// for prompt check promptEnhancer
// router.post('/enhancedPrompt',upload.single("image"),imageToText,promptEnhancer,async(req,res)=>{
//  try{
//     if(!req.file){
//         throw new Error("file is not found");
//     }
//     res.status(200).json({status:200,updatedPrompt:req.updatedPrompt})
//  }
//  catch(error){
//     res.status(422).json({status: 422 ,message:"this is message",error :error});
//  }
// });

router.post("/aitest", promptEnhancer, async (req, res) => {
  console.log("Request body: outside try in after middleware", req.body);
  try {
    const prompt = req.updatedPrompt;

    if(!prompt){
      console.error("Middleware 'promptEnhancer' failed to add ''updatedprompt");
      if(!res.headersSent){
        return res.status(500).json({status: 500, error: "promptenhancement step failed"});
      }

      return;
    }

    console.log("recived enhanced prompt ", prompt);
    const url =await imageGenerator(prompt);
    res.status(200).json({ 
      status: 200, 
      prompt: prompt,
      url: url
    });
  } catch (error) {
    console.error("Error in route handler:", error);
    res.status(500).json({ status: 500, error: "Internal server error" });
  }
});

// New route for generating forum topic content
router.post("/generateTopicContent", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ status: 400, error: "Prompt is required" });
    }

    final_Prompt = `Generate a forum topic based on the folowing idea: "${prompt}" .
    
    Please provide the output in this format:
    Title: [Generated Title Here]
    
    [Generated detailed forum post content here]`;

    console.log("sending prompt to AI for the topic gneration: ", final_Prompt);

    const result = await model.generateContent(final_Prompt);
    const generatedText = result.response.text();
    console.log("Recived raw responce from AI: ", generatedText);

    let title = `AI TOPIC: ${prompt.substring(0, 40)} ...`;
    let body  = generatedText;

    const lines = generatedText.split('\n');
    const titleLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('title:'));

    if(titleLineIndex !== -1){
      title = lines[titleLineIndex].substring(6).trim();

      //Findstart
      let bodyStartIndex = titleLineIndex + 1;
      while(bodyStartIndex < lines.length && lines[bodyStartIndex].trim()===''){
        bodyStartIndex++;
      }
      body = lines.slice(bodyStartIndex).join('\n').trim();
    }else{
      console.warn("AI response format might not contains 'Title:: useing default")
    }
    // For demonstration, we'll return the enhanced prompt
    // In a real implementation, you might want to structure this differently
    res.status(200).json({ 
      status: 200, 
      content: {
        title: title,
        body: body
      }
    });
  } catch (error) {
    console.error("Error generating topic content:", error);
    res.status(500).json({ status: 500, error: "Failed to generate topic content" });
  }
});

// New route for generating AI responses to forum topics
router.post("/generateTopicResponse", async (req, res) => {
  try {
    const { topicContent, userMessages } = req.body;
    
    if (!topicContent) {
      return res.status(400).json({ status: 400, error: "Topic content is required" });
    }

    // Combine topic content with user messages for context
    const contextPrompt = `
      Topic: ${topicContent}
      ${userMessages ? `User's question/comment: ${userMessages}` : ''}
      Please provide a helpful and engaging response that adds value to this discussion.
    `;

    // Use the text suggestion function for generating responses
    const aiResponse = await textSuggestion(contextPrompt);
    
    if (!aiResponse) {
      throw new Error("Failed to generate AI response");
    }
    
    res.status(200).json({ 
      status: 200, 
      response: aiResponse
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({ 
      status: 500, 
      error: error.message || "Failed to generate AI response. Please try again."
    });
  }
});

// Update the generateReplyImage route

// router.post("/generateReplyImage/:id", fetchAncestorContext, async (req, res, next) => {
//   try {


//     console.log('Route handler - Request params:', req.params);
//     console.log('Route handler - Request body:', req.body);
    
//     const { userQuery } = req.body;
//     const { contextType } = req.body;
//     const { ancestorContext } = req;
    
//     console.log('Route handler - Extracted values:', {
//       userQuery,
//       contextType,
//       ancestorContext
//     });
    
//     if (!userQuery) {
//       return res.status(400).json({ status: 400, error: "User query is required" });
//     }


//     const llmPrompt = `
// Context Type: ${contextType}
// Ancestor Context (P1 is the most recent parent):
// ${ancestorContext}

// User Query (replying to item with ID ${req.params.id}): ${userQuery}

// Generate the response content:
//     `;


//     console.log('Generated LLM prompt:', llmPrompt);

//       return res.status(200).json({ 
//                status: 200, 
//                LLmprommpt: llmPrompt
//           });
    
//    // req.body.prompt = llmPrompt;
    
//     // Call promptEnhancer middleware
//     // promptEnhancer(req, res, async () => {
//     //   try {
//     //     const prompt = req.updatedPrompt;
//     //     console.log("Enhanced prompt from middleware:", prompt);
//     //     console.log("Starting image generation process for prompt:", prompt);

        
//     //     // Generate the image using OpenAI
//     //     // const imageUrl = await imageGenerator(prompt);
//     //     console.log("Generated image URL:", imageUrl);
        
//     //     if (!imageUrl) {
//     //       throw new Error("Image generation failed - no URL returned");
//     //     }

//     //     // Download the image from OpenAI
//     //     console.log("Downloading image from OpenAI...");
//     //     const imageBuffer = await downloadImage(imageUrl);
//     //     console.log("Image downloaded successfully, size:", imageBuffer.length);
        
//     //     console.log("About to call describeImage function...");
//     //     const description = await describeImage(imageBuffer);
//     //     console.log("describeImage function returned:", description);
        
//     //     // Upload to S3
//     //     console.log("Starting S3 upload...");
//     //     const s3Url = await uploadToS3(imageBuffer);
//     //     console.log("Successfully uploaded to S3:", s3Url);
        
//     //     // Return the successful response with S3 URL
//     //     return res.status(200).json({ 
//     //       status: 200, 
//     //       imageUrl: s3Url,
//     //       prompt: prompt,
//     //       description: description
//     //     });
//     //   } catch (innerError) {
//     //     console.error("Detailed error in image generation process:", {
//     //       message: innerError.message,
//     //       stack: innerError.stack,
//     //       code: innerError.code
//     //     });
        
//     //     return res.status(500).json({ 
//     //       status: 500, 
//     //       error: innerError.message || "Failed to process image. Please try again.",
//     //       details: process.env.NODE_ENV === 'development' ? innerError.stack : undefined
//     //     });
//     //   }
//     // });
//   } catch (error) {
//     console.error("Error in route handler:", error);
//     return res.status(500).json({ 
//       status: 500, 
//       error: "Server error while processing image generation request",
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

// we can delete
// router.post("/generate-image", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Image file is required" });
//     }

//     const imagePath = req.file.path; // This is the file path
//     console.log("Uploaded file path:", imagePath);
    
//     // Read the image file
//     const imageBuffer = fs.readFileSync(imagePath);

//     // Process the image with OpenAI
//     // ...

//     // Delete the file after processing
//     fs.unlinkSync(imagePath);

//     res.json({ message: "Image processed successfully" });
//   } catch (error) {
//     console.error("Error processing image:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// New route for context-aware requests
/**
 * Context-Aware LLM Request Handler
 * 
 * This endpoint processes requests with conversation context awareness. It can handle both
 * text responses and image generation based on the context of the conversation.
 * 
 * URL: POST /api/llm/contextAwareRequest/:id
 * 
 * Path Parameters:
 * - id: The ID of the starting node (forum reply or comment) to build context from
 * 
 * Request Body:
 * {
 *   "contextType": "forumReply" or "comment", // Type of the context to retrieve
 *   "prompt": "Your question or request" // User's prompt/question
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "type": "text" or "image",
 *     // For text responses:
 *     "content": "AI-generated response text",
 *     // For image responses:
 *     "imageUrl": "URL to generated image",
 *     "description": "Description used to generate the image"
 *   }
 * }
 * 
 * The system automatically detects if the user is requesting an image based on the prompt 
 * and responds accordingly with either text or an image.
 */
router.post("/contextAwareRequest/:id", fetchAncestorContext, processContextAwareRequest);


// global router for model selection 
// here we have to select model
// router.post("/global-route",async(req,res)=>{

  router.post("/stateselection", async (req, res) => {
    try {
      // Extract the text prompt and control bits from the request
      const { textPrompt, controlBits = {}, contextType, entityId } = req.body;
      
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
        processingSteps: []
      };
            // Step 4: Context-Aware Request Processing (if bit is on)
            if (controlBits.processContextAware) {
              try {
                // Modified to work with your context-aware processing
                if (!req.ancestorContext && entityId && contextType) {
                  // Create a temporary request and response object to use with fetchAncestorContext
                  const tempReq = {
                    params: { id: entityId },
                    body: { contextType }
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
                        }
                      };
                    }
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
                    console.error("Failed to fetch ancestor context:", contextError || "No context returned");
                  } else {
                    // Format the context for the AI
                    const formattedContext = formatContextForAI(tempReq.ancestorContext);
                    
                    // Analyze request type
                    const requestType = analyzeRequestType(result.currentText);
                    
                    let contextResult;
                    
                    if (requestType === 'IMAGE_REQUEST') {
                      // Extract what the image should be of
                      const imageDescription = await extractImageDescription(formattedContext, result.currentText);
                      
                      // Use existing imageGenerator function to generate the image
                      const imageUrl = await imageGenerator(imageDescription || result.currentText);
                      
                      contextResult = {
                        type: "image",
                        imageUrl: imageUrl,
                        description: imageDescription
                      };
                    } else {
                      // Generate text response
                      const textResponse = await generateTextResponse(formattedContext, result.currentText);
                      
                      contextResult = {
                        type: "text",
                        content: textResponse
                      };
                    }
                    
                    result.contextAwareResponse = contextResult;
                    result.currentText = contextResult.type === "text" ? contextResult.content : result.currentText;
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
        result: result
      });
      
    } catch (error) {
      console.error("Error in state selection API:", error);
      return res.status(500).json({
        success: false,
        error: "An error occurred while processing your request",
        details: error.message
      });
    }
  });
  


// });

module.exports = router;
