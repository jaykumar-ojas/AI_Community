const {GoogleGenerativeAI} = require("@google/generative-ai");
const { OpenAI } = require("openai");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const ForumReply = require('../models/forumReplySchema');
const Comment = require('../models/commentsModel');
const ForumTopic = require('../models/forumTopicSchema');
const Post = require('../models/postSchema');
const axios = require('axios');
const { ObjectId } = require('mongodb');
const { decodeId } = require('../utils/hashids');




dotenv.config();


// model defined
const genAI = new GoogleGenerativeAI("AIzaSyCrBM4stDGV58k4Kywt-xoZafjzveW6ZSA");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY, // Replace with your OpenAI API key
});

function fileToGenerativePart(fileBuffer, mimeType) {
    return {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType,
      },
    };
  }

const promptEnhancer =async(req,res,next)=>{
    try {

        // when call from frontend make sure prompt send 
        // in this format :- prompt : "iahgajdg";
        
        const userPrompt = req.body.prompt;
      //  const  description  = req.description || " ";
        // if (!description) {
        //   return res.status(400).json({ error: "Prompt is required" });
        // }
        const CONSTANT_PROMPT = "As a professional prompt engineer give prompt to generate image by this descirption and strict limit of 100 words: ";
        const final_prompt = CONSTANT_PROMPT +  userPrompt;
    
        const result = await model.generateContent(final_prompt);
        const responseText = result.response.text();
        
        req.updatedPrompt = responseText;
        next();
        // res.json({ response: responseText });
      } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: "Failed to generate text" });
      }
};

const textSuggestion = async(text) => {
  try {
    if (!text) {
      throw new Error("Text field is required");
    }

    const userPrompt = "Analyze the given text and provide a helpful, engaging response that adds value to the discussion. The response should be informative and maintain a conversational tone:";
    const final_prompt = userPrompt + "\n\n" + text;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better responses
      messages: [{ role: "user", content: final_prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    // Return the AI response
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error; // Let the route handler deal with the error
  }
};

const describeImage = async (imageBuffer) => {
  console.log("Describing image buffer, size:", imageBuffer?.length || 0);

  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      console.error("No valid image buffer provided for description");
      return null;
    }

    const base64Image = imageBuffer.toString("base64");
    const mimeType = detectMimeType(imageBuffer) || "image/png";

    console.log("Sending image to OpenAI for detailed description...");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1", // most powerful model
      messages: [
        {
          role: "system",
          content: "You are an expert visual interpreter. Provide extremely detailed and accurate image descriptions in JSON format."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Provide a highly detailed and precise description of this image.
Focus on:
- Key objects and their attributes (color, shape, size, texture)
- People (appearance, clothing, facial expressions, actions, poses)
- Environment (setting, background details, lighting, perspective, atmosphere)
- Overall mood or story conveyed

Return the result as JSON with these fields:
{
  "objects": [ ... ],
  "people": [ ... ],
  "environment": "...",
  "lighting": "...",
  "mood": "...",
  "detailed_description": "..."
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_completion_tokens: 1500, // ✅ correct param name
      response_format: { type: "json_object" }, // enforce JSON
    });

    if (response?.choices?.[0]?.message?.content) {
      const raw = response.choices[0].message.content;
      console.log("Successfully received image description");

      try {
        return JSON.parse(raw); // structured JSON
      } catch (parseErr) {
        console.warn("Response was not valid JSON, returning raw text");
        return raw;
      }
    } else {
      console.error("Invalid response structure from OpenAI");
      return null;
    }

  } catch (error) {
    console.error("Error in describeImage function:", error);
    if (error.response) {
      console.error("OpenAI error details:", error.response.data);
    }
    return null;
  }
};




const downloadImage = async (url) => {
  try {
    console.log("Downloading image from URL:", url);
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error downloading image from URL:", url, error.message);
    return null;
  }
};

// Add the missing detectMimeType function
const detectMimeType = (buffer) => {
  // Simple MIME type detection based on file signatures
  const signatures = {
    '/9j/': 'image/jpeg',
    'iVBORw0KGgo': 'image/png',
    'R0lGODlh': 'image/gif',
    'UklGRg==': 'image/webp'
  };
  
  const base64 = buffer.toString('base64');
  
  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (base64.startsWith(signature)) {
      return mimeType;
    }
  }
  
  return 'image/png'; // Default fallback
};

const extractImageUrls = (document) => {
  const imageUrls = [];
  
  // Extract from content array
  if (document.content && Array.isArray(document.content)) {
    document.content.forEach((item, index) => {
      if (item.imageUrl && item.imageUrl.fileUrl) {
        imageUrls.push({
          url: item.imageUrl.fileUrl,
          source: 'content',
          index: index,
          fileName: item.imageUrl.fileName || `content_image_${index}`
        });
      }
    });
  }
  
  // Extract from mediaAttachments
  if (document.mediaAttachments && Array.isArray(document.mediaAttachments)) {
    document.mediaAttachments.forEach((attachment, index) => {
      if (attachment.fileUrl) {
        imageUrls.push({
          url: attachment.fileUrl,
          source: 'mediaAttachments',
          index: index,
          fileName: attachment.fileName || `media_image_${index}`
        });
      }
    });
  }
  
  return imageUrls;
};

const addImageDescriptions = async (objectId, db) => {
  try {
    console.log("Processing document with ObjectId:", objectId);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(objectId)) {
      throw new Error("Invalid ObjectId provided");
    }
    
    // Check if database connection is valid
    if (!db) {
      throw new Error("Database connection is not available");
    }
    
    // List available collections for debugging
    try {
      const collections = await db.listCollections().toArray();
      console.log("Available collections:", collections.map(c => c.name));
    } catch (err) {
      console.error("Error listing collections:", err);
    }
    
    // Try different possible collection names
    const possibleCollections = ['forumreplies', 'postcomments'];
    let collection = null;
    let document = null;
    
    for (const collectionName of possibleCollections) {
      try {
        collection = db.collection(collectionName);
        document = await collection.findOne({ _id: new mongoose.Types.ObjectId(objectId) });
        if (document) {
          console.log(`Found document in collection: ${collectionName}`);
          break;
        }
      } catch (err) {
        console.log(`Collection ${collectionName} not found or error:`, err.message);
        continue;
      }
    }
    
    if (!document) {
      console.error("Document not found with ObjectId:", objectId, "in any collection");
      return {
        success: false,
        error: "Document not found with the provided ObjectId",
        document: null
      };
    }
    
    console.log("Document found, processing content and mediaAttachments arrays...");
    
    let processedCount = 0;
    let updatedContent = document.content ? [...document.content] : [];
    let updatedMediaAttachments = document.mediaAttachments ? [...document.mediaAttachments] : [];
    
    // Process content array to find items with imageUrl
    if (Array.isArray(document.content)) {
      for (let i = 0; i < updatedContent.length; i++) {
        const contentItem = updatedContent[i];
        
        // Check if this content item has an imageUrl
        if (contentItem.imageUrl && contentItem.imageUrl.fileUrl) {
          try {
            console.log(`Processing content image ${i}: ${contentItem.imageUrl.fileName || 'unnamed'}`);
        
        // Download image
            const imageBuffer = await downloadImage(contentItem.imageUrl.fileUrl);
        
        if (!imageBuffer) {
              console.log(`Failed to download image for content item ${i}`);
          continue;
        }
        
        // Get description
        const description = await describeImage(imageBuffer);
        
            if (description) {
              // Add description to the content item
              updatedContent[i] = {
                ...contentItem,
                description: description
              };
              processedCount++;
              console.log(`Added description to content item ${i}`);
            }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
            console.error(`Error processing image for content item ${i}:`, error);
          }
        }
      }
    }
    
    // Process mediaAttachments array
    if (Array.isArray(document.mediaAttachments)) {
      for (let i = 0; i < updatedMediaAttachments.length; i++) {
        const mediaItem = updatedMediaAttachments[i];
        
        console.log("Processing media attachment:", mediaItem);
        // Check if this media item has a fileUrl
        if (mediaItem.fileUrl) {
          try {
            console.log(`Processing media attachment ${i}: ${mediaItem.fileName || 'unnamed'}`);
            
            // Download image
            const imageBuffer = await downloadImage(mediaItem.fileUrl);
            
            if (!imageBuffer) {
              console.log(`Failed to download image for media attachment ${i}`);
              continue;
            }
            
            // Get description
            const description = await describeImage(imageBuffer);
            
            if (description) {
              // Add description to the media item
              updatedMediaAttachments[i] = {
                ...mediaItem,
                description: description
              };
              processedCount++;
              console.log(`Added description to media attachment ${i}`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`Error processing image for media attachment ${i}:`, error);
          }
        }
      }
    }
    
    if (processedCount === 0) {
      console.log("No images found in content or mediaAttachments arrays");
      return {
        success: true,
        message: "No images found in content or mediaAttachments arrays",
        document: document
      };
    }
    
    // Update document with modified arrays
    const updateData = {
          lastDescriptionUpdate: new Date()
    };
    
    if (updatedContent.length > 0) {
      updateData.content = updatedContent;
        } 
    
    if (updatedMediaAttachments.length > 0) {
      updateData.mediaAttachments = updatedMediaAttachments;
      }
    
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(objectId) },
      { $set: updateData }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log(`Successfully updated document with ${processedCount} image descriptions`);
      
      // Fetch and return updated document
      const updatedDocument = await collection.findOne({ _id: new ObjectId(objectId) });
      
      return {
        success: true,
        message: `Successfully processed ${processedCount} images`,
        document: updatedDocument
      };
    } else {
      throw new Error("Failed to update document in database");
    }
    
  } catch (error) {
    console.error("Error in addImageDescriptions:", error);
    return {
      success: false,
      error: error.message,
      document: null
    };
  }
};

const handleImageDescriptionRequest = async (req, res) => {
  try {
    const { objectId } = req.params;
    
    console.log("handleImageDescriptionRequest called with objectId:", objectId);
    
    if (!objectId) {
      return res.status(400).json({
        success: false,
        error: "ObjectId is required"
      });
    }

    // For image description requests, check if it's a topic or forum reply
    // Only decode hashids for topics, not for forum replies
    let decodedObjectId;
    
    // Check if this is a topic by looking for a flag in the request
    const isTopic = req.body && req.body.isTopic;
    
    if (isTopic) {
      // Decode hashid for topics
      try {
        decodedObjectId = decodeId(objectId);
        console.log('Decoded topic objectId:', { original: objectId, decoded: decodedObjectId });
        
        // Handle case where decodeId returns an array
        if (Array.isArray(decodedObjectId) && decodedObjectId.length > 0) {
          decodedObjectId = decodedObjectId[0];
          console.log('Extracted first ID from array:', decodedObjectId);
        }
        
      } catch (error) {
        console.log('Failed to decode topic hashid:', objectId, error.message);
        return res.status(400).json({
          success: false,
          error: "Invalid hashid format for topic"
        });
      }

      // Validate the decoded ObjectId for topics
      if (!mongoose.Types.ObjectId.isValid(decodedObjectId)) {
        console.log('Invalid decoded ObjectId for topic:', decodedObjectId);
        return res.status(400).json({
          success: false,
          error: "Invalid ID format after decoding topic"
        });
      }
    } else {
      // For forum replies, use the ID as-is (no decoding)
      decodedObjectId = objectId;
      console.log('Using forum reply ID as-is (no decoding):', decodedObjectId);
    }
    
    // Check if mongoose connection is ready
    if (!mongoose.connection || !mongoose.connection.db) {
      console.error("Mongoose connection not ready");
      return res.status(500).json({
        success: false,
        error: "Database connection not available"
      });
    }
    
         // Use mongoose connection instead of req.db
     const db = mongoose.connection.db;
     console.log("Database connection obtained, calling addImageDescriptions...");
     if (isTopic) {
       console.log("Using decoded ObjectId for topic database query:", decodedObjectId);
     } else {
       console.log("Using forum reply ID as-is for database query:", decodedObjectId);
     }
    
    const result = await addImageDescriptions(decodedObjectId, db);
    console.log("addImageDescriptions result:", result);
    
    if (result && result.success) {
      res.status(200).json(result);
    } else {
      const errorMessage = result ? result.error : "Unknown error occurred";
      console.error("addImageDescriptions failed:", errorMessage);
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
    
  } catch (error) {
    console.error("Error in handleImageDescriptionRequest:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};


async function generateTextResponse(context, userPrompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant in a forum discussion. 
                   Use the provided conversation context to understand the discussion 
                   and give a relevant, context.`
        },
        {
          role: "user",
          content: `${context}\n\nThe user has asked: "${userPrompt}"\n\nPlease provide a helpful response that takes the conversation context into account.`
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text response:", error);
    return null;
  }
}


function getFirstNWords(text, n) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.slice(0, n).join(' ');
}

function extractContentText(contentArray) {
  if (!contentArray || !Array.isArray(contentArray)) {
    return '';
  }
  
  return contentArray.map(item => {
    let text = '';
    if (item.userText) text += item.userText + ' ';
    if (item.aiText) text += item.aiText + ' ';
    if (item.prompt) text += item.prompt + ' ';
    
    // Handle imageUrl with description
    if (item.imageUrl && item.description) {
      text += `[Image: ${item.description}] `;
    } else if (item.imageUrl && !item.description) {
      text += '[Image attached] ';
    }
    
    return text.trim();
  }).filter(text => text.length > 0).join(' ');
}

function extractMediaDescriptions(mediaAttachments) {
  if (!mediaAttachments || !Array.isArray(mediaAttachments)) {
    return '';
  }
  
  return mediaAttachments
    .map(media => media.description || '')
    .filter(desc => desc.length > 0)
    .join(' ');
}

async function fetchAncestorContext(req, res, next) {
  try {
    const startId = req.params.id;
    const contextType = req.body.contextType;
    console.log("fetchAncestorContext called with:", { startId, contextType });
    if (!startId) {
      return res.status(400).json({
        success: false,
        message: "Missing ID for context fetching",
      });
    }

    // For simplicity I’ll keep your decoding logic
    let decodedId = startId;
    // if (contextType === "forumReply" && req.body.isTopic) {
    //   try {
    //     decodedId = startId;
    //     if (Array.isArray(decodedId) && decodedId.length > 0) {
    //       decodedId = decodedId[0];
    //     }
    //   } catch (error) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Invalid hashid format for topic",
    //     });
    //   }
    // }

    let SelectedModel, parentIdFieldName, parentContextModel;
    if (contextType === "forumReply") {
      SelectedModel = ForumReply;
      parentIdFieldName = "topicId";
      parentContextModel = ForumTopic;
    } else if (contextType === "comment") {
      SelectedModel = Comment;
      parentIdFieldName = "postId";
      parentContextModel = Post;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid context type",
      });
    }

    // fetch starting node
    let startingNode = await SelectedModel.findById(decodedId).lean();
    console.log("Starting node fetched:", startingNode ? "found" : "not found");
    if (!startingNode) {
      return res.status(404).json({
        success: false,
        message: "Starting node not found",
      });
    }

    // collect ancestor chain
    const maxDepth = 3;
    const ancestorChain = [];
    let currentId = decodedId;
    let depth = 0;

    while (currentId && depth <= maxDepth) {
      const node = await SelectedModel.findById(currentId).lean();
      console.log(`Ancestor at depth ${depth}:`, node ? "found" : "not found");
      if (!node) break;

      ancestorChain.push({ node, depth });
      currentId = node.parentReplyId;
      depth++;
    }

    // add parent topic/post context
    let parentContext = null;
    console.log("starting node",startingNode[parentIdFieldName]);
    if (startingNode[parentIdFieldName]) {
      parentContext = await parentContextModel.findById(
        startingNode[parentIdFieldName]
      ).lean();
    }

    // 🔑 transform into structured JSON by user
    const structuredContext = {};
    const assignPriority = (depth) => 20 - depth*5; // depth=0 → high priority

    // parent context first (highest priority)
    if (parentContext) {
      structuredContext[parentContext.userName || "Unknown"] = {
        priority: 10,
        meta: {
          // userId: parentContext.userId?.toString(),
          // userName: parentContext.userName,
          title: parentContext.title || "",
          content: parentContext.desc ||  "",
          // createdAt: parentContext.createdAt,
          // depth: -1,
          // isParentContext: true,
        },
      };
    }

        for (const { node, depth } of ancestorChain) {
          // build a cleaned content array
          console.log(`Processing node at depth ${depth} by user ${node.userName || 'Unknown'}`);
          const cleanedContent = [];

          // Handle node.content
          if (Array.isArray(node.content)) {
            node.content.forEach((item) => {
              const filtered = {
                userText: item.userText || null,
                prompt: item.prompt || null,
                aiText: item.aiText || null,
                model: item.model || null,
              };

              // keep description if it exists
              if (item.description) {
                filtered.description = item.description;
              }

              // Only push if it has something useful
              if (
                filtered.userText ||
                filtered.prompt ||
                filtered.aiText ||
                filtered.model ||
                filtered.description
              ) {
                cleanedContent.push(filtered);
              }
            });
          }

          // Handle media attachments
          if (Array.isArray(node.mediaAttachments)) {
            node.mediaAttachments.forEach((m) => {
              if (m.description) {
                cleanedContent.push({
                  userText: null,
                  prompt: null,
                  aiText: null,
                  model: null,
                  description: m.description,
                });
              }
            });
          }

          const key = `${node.userName || "Unknown"}_${node.id || node._id}`;

          // Assign structured context
          structuredContext[key] = {
            priority: assignPriority(depth),
            description: {
              sources: {
                content: cleanedContent, // ✅ cleaned, minimal content
              },
            },
          };
        }

       // console.log("Structured context constructed:", structuredContext);
    // attach to req
    req.structuredContext = {
      conversationContext: structuredContext,
      newUserPrompt: req.body.newPrompt || "",
      finalInstruction: `Based on the above structured conversation context and the new user request, create a detailed, coherent, contextually-aware prompt for downstream generative models.`,
    };
  //  console.log("Structured context prepared:", req.structuredContext);
    next();
  } catch (err) {
    console.error("Error in fetchAncestorContext:", err);
    next(err);
  }
}


async function textSuggestionWithContext(req, res, next) {
  try {
    const structured = req.structuredContext;
    if (!structured || !structured.conversationContext) {
      return res.status(400).json({
        success: false,
        message: "Missing structured context for text suggestion",
      });
    }

    const { conversationContext, newUserPrompt, finalInstruction } = structured;

    // 🔑 Build narrative summary from structured context safely
    const summaryParts = Object.entries(conversationContext)
      .sort((a, b) => (b[1]?.priority || 0) - (a[1]?.priority || 0)) // safe compare
      .map(([user, data]) => {
        const safeMeta = data?.meta || {};
        const safeDescription = data?.description?.sources?.content || [];

        const userName = safeMeta.userName || user || "Unknown";

        // Build text body flexibly
        let body = "";

        if (safeDescription.length > 0) {
          body += `Content: ${JSON.stringify(safeDescription)}`;
        }

        if (safeMeta.title) {
          body += (body ? " | " : "") + `Title: ${safeMeta.title}`;
        }

        if (safeMeta.content) {
          body += (body ? " | " : "") + `Post: ${safeMeta.content}`;
        }

        if (!body) {
          body = "(no content provided)";
        }

        return `- **${userName}** (priority ${data?.priority ?? "N/A"}): ${body}`;
      });

    const conversationSummary = summaryParts.join("\n");

    // 🔑 Construct AI-ready prompt
    const aiPrompt = `
You are an AI system assisting in a forum-like creative workspace.

Here is the structured conversation context so far:
${conversationSummary}

The new user request is:
"${newUserPrompt || "No new prompt provided"}"

Your task:
${finalInstruction || "Continue the conversation or generate creative content."}

Guidelines for your response:  

1.) Respect the **priority hierarchy** when deciding which details matter most. 
2.) Ensure your response feels like a natural continuation of this thread, not an isolated output.  
3.) Be descriptive, coherent, and imaginative — combining text and image context seamlessly.  
`;

    // 🔥 Call AI to get suggestion
    /* un commnet in live
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a Prompt Engineering Expert dont write i am giving this suggestions here are my results like this just directly give prompt as humans. 
Everything you generate will be passed directly to the next model for content generation, so it must always be a highly enriched, detailed, and contextually aware prompt. Never mention missing inputs, limitations, or irrelevant content — always assume the required information exists and expand it into the strongest possible prompt for optimal results.`,
        },
        {
          role: "user",
          content: aiPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });

    const suggestion = aiResponse.choices?.[0]?.message?.content?.trim() || "";
      */
     const suggestion = "hello";
    console.log("AI suggestion generated successfully", suggestion);

  req.contextForAI = {
    structuredJSON: structured,
    promptText: aiPrompt,
    suggestion, // attach AI-generated suggestion here
};
next();

  } catch (err) {
    console.error("Error in textSuggestionWithContext:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI suggestion",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}






const promptEnhancerAI = async (prompt) => {
  try {
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    console.log('prompt',prompt);
    const userPrompt = "Improve this image generation prompt to create a more detailed, vivid, and artistic description:";
    const final_prompt = userPrompt + "\n\n" + prompt;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1", 
      messages: [{ role: "user", content: final_prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });
    console.log('responce', response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw error;
  }
};

// Add the missing extractImageDescription function
const extractImageDescription = async (context, userPrompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed image descriptions for AI image generation. Extract what the user wants to see in an image based on their request and the conversation context."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nUser request: ${userPrompt}\n\nCreate a detailed, vivid description of what image should be generated. Focus on visual elements, style, composition, and mood.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error extracting image description:", error);
    return userPrompt; // Fallback to original prompt
  }
};

function formatContextForAI(ancestorContext) {
  if (!ancestorContext || !ancestorContext.nodes) {
    return '';
  }

  const { nodes, summary } = ancestorContext;
  
  let prompt = `CONVERSATION CONTEXT (${summary.totalNodes} messages, depth: ${summary.depthReached}):\n\n`;
  
  nodes.forEach(node => {
    let label;
    if (node.isStartNode) {
      if (node.isDirectComment) {
        label = '🆕 NEW COMMENT';
      } else {
        label = '🎯 CURRENT MESSAGE';
      }
    } else {
      label = `📖 ${node.depth} levels back`;
    }
    
    const mediaInfo = node.mediaCount > 0 ? ` 📎${node.mediaCount}` : '';
    
    prompt += `${label}${mediaInfo} - ${node.userName}:\n`;
    prompt += `"${node.content}"\n\n`;
  });
  
  if (summary.totalMedia > 0) {
    prompt += `📎 Total media attachments: ${summary.totalMedia}\n`;
  }
  
  return prompt;
}

module.exports ={
    openai,
    model,
    describeImage,
    promptEnhancer,
    promptEnhancerAI,
    textSuggestion,
    fetchAncestorContext,
    formatContextForAI,
    generateTextResponse,
    addImageDescriptions,
    handleImageDescriptionRequest,
    describeImage,
    extractImageDescription,
    detectMimeType,
    getFirstNWords,
    extractContentText,
    extractMediaDescriptions,
    textSuggestionWithContext
};

