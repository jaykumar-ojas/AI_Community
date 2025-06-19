const {GoogleGenerativeAI} = require("@google/generative-ai");
const { OpenAI } = require("openai");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const ForumReply = require('../models/forumReplySchema');
const Comment = require('../models/commentsModel');
const axios = require('axios');
const { ObjectId } = require('mongodb');



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

const imageToText = async(req,res,next)=>{
    try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }
    
        const prompt = "Describe the contents of this image.";
        const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);
    
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        req.description = responseText;
        next();
      } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: "Failed to process the image" });
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

const imageGenerator = async(text)=>{
  try{
    if(!text){
      console.error("No text provided for image generation");
      return null;
    }

    console.log("Generating image with prompt:", text);

    // Create a new OpenAI instance with the API key
   
    // Call the OpenAI API to generate an image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      n:1
  
    });
    console.log("i m succssfylly ocme to generate imgages");
  
    // Extract the image URL from the response
    if (response && response.data && response.data[0] && response.data[0].url) {
      const imageUrl = response.data[0].url;
      console.log("Successfully generated image URL");
      return imageUrl;
    } else {
      console.error("Invalid response structure from OpenAI");
      return null;
    }
  }
  catch(error){
    console.error("Error in imageGenerator function:", error);
    return null;
  }
}

const describeImage = async (imageBuffer) => {
  console.log("Describing image buffer, size:", imageBuffer.length);
  
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      console.error("No valid image buffer provided for description");
      return null;
    }

    const base64Image = imageBuffer.toString('base64');
    const mimeType = detectMimeType(imageBuffer) || 'image/png';

    console.log("Sending image to OpenAI for description...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image concisely for forum context. Focus on key objects, people, and actions. Keep it under 50 words.",
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
      max_tokens: 150,
    });

    if (response?.choices?.[0]?.message?.content) {
      const description = response.choices[0].message.content;
      console.log("Successfully received image description");
      return description;
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
    if (!ObjectId.isValid(objectId)) {
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
        document = await collection.findOne({ _id: new ObjectId(objectId) });
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
    
    const result = await addImageDescriptions(objectId, db);
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
      model: "gpt-4",
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

    console.log('fetchAncestorContext - Input:', { startId, contextType });

    const maxDepth = 10;
    const maxWordsPerNode = 50;
    const maxTotalContextWords = 500;

    // Validation
    if (!startId || !mongoose.Types.ObjectId.isValid(startId)) {
      console.log('Invalid ID:', startId);
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing ID for context fetching'
      });
    }

    if (!contextType || (contextType !== 'forumReply' && contextType !== 'comment')) {
      console.log('Invalid context type:', contextType);
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid context type'
      });
    }

    let SelectedModel;
    let parentIdField;
    
    if (contextType === 'forumReply') {
      SelectedModel = ForumReply;
      parentIdField = 'parentReplyId';
    } else if (contextType === 'comment') {
      SelectedModel = Comment;
      parentIdField = 'parentReplyId'; // Changed this line - assuming comments use 'parentCommentId'
    }

    console.log('Selected model configuration:', { 
      modelName: SelectedModel.modelName,
      parentIdField
    });

    const ancestorNodes = [];
    let currentId = startId;
    let totalWords = 0;

    // Build ancestor chain from bottom to top
    for (let depth = 0; depth <= maxDepth; depth++) {
      console.log(`Fetching node at depth ${depth}, currentId:`, currentId);
      
      const currentNode = await SelectedModel.findById(currentId)
        .select(`content description mediaAttachments userName userId createdAt ${parentIdField} _id`)
      .lean();
      
      if (!currentNode) {
        console.log(`Node not found at depth ${depth}`);
        break;
      }

      // Extract text content (same logic for both types since they have same structure)
      let textContent = '';
      if (currentNode.content) {
        textContent = extractContentText(currentNode.content);
      } else {
        textContent = currentNode.description || '';
      }

      // Extract media descriptions from mediaAttachments
      const mediaDescriptions = extractMediaDescriptions(currentNode.mediaAttachments);
      
      // Count images in content array (same logic for both types)
      let contentImageCount = 0;
      if (currentNode.content) {
        contentImageCount = currentNode.content.filter(item => item.imageUrl).length;
      }
      
      // Combine text and media descriptions
      const fullText = [textContent, mediaDescriptions].filter(t => t.length > 0).join(' ');
      
      // Truncate to word limit
      const truncatedText = getFirstNWords(fullText, maxWordsPerNode);
      
      // Count words for total limit
      const wordCount = truncatedText.split(/\s+/).filter(word => word.length > 0).length;
      
      if (totalWords + wordCount > maxTotalContextWords && depth > 0) {
        console.log('Reached maximum total context words limit');
        break;
      }

      totalWords += wordCount;

      // Create structured ancestor node
      const ancestorNode = {
        id: currentNode._id.toString(),
        depth: depth,
        priority: 10 - depth, // Higher priority for closer ancestors
        content: truncatedText,
        userName: currentNode.userName || 'Unknown',
        userId: currentNode.userId?.toString(),
        createdAt: currentNode.createdAt,
        mediaCount: (currentNode.mediaAttachments ? currentNode.mediaAttachments.length : 0) + contentImageCount,
        mediaAttachments: currentNode.mediaAttachments || [],
        contentImages: contentImageCount,
        isStartNode: depth === 0
      };

      ancestorNodes.push(ancestorNode);

      console.log(`Added ancestor at depth ${depth}:`, {
        priority: ancestorNode.priority,
        content: ancestorNode.content.substring(0, 100) + '...',
        mediaCount: ancestorNode.mediaCount,
        userName: ancestorNode.userName
      });

      // Check for parent
      if (!currentNode[parentIdField]) {
        console.log('No parent found, reached root');
        break;
      }

      currentId = currentNode[parentIdField];
    }

    // Sort by priority (highest first - closest ancestors)
    ancestorNodes.sort((a, b) => b.priority - a.priority);

    // Create structured context string
    const contextString = ancestorNodes
      .map(node => {
        const prefix = node.isStartNode ? 'CURRENT' : `ANCESTOR_${node.depth}`;
        const mediaInfo = node.mediaCount > 0 ? ` [${node.mediaCount} media]` : '';
        const contentImgInfo = node.contentImages > 0 ? ` [${node.contentImages} inline images]` : '';
        const userInfo = ` (by ${node.userName})`;
        return `${prefix}${userInfo}${mediaInfo}${contentImgInfo}: ${node.content}`;
      })
      .join(' | ');

    // Extract all media attachments with metadata
    const allMediaAttachments = ancestorNodes
      .flatMap(node => node.mediaAttachments.map(media => ({
        ...media,
        sourceNodeId: node.id,
        sourceDepth: node.depth,
        sourceUserName: node.userName
      })));

    // Create summary statistics
    const contextSummary = {
      totalNodes: ancestorNodes.length,
      totalWords: totalWords,
      totalMedia: allMediaAttachments.length,
      depthReached: Math.max(...ancestorNodes.map(n => n.depth)),
      rootUserName: ancestorNodes.length > 0 ? ancestorNodes[ancestorNodes.length - 1].userName : null
    };

    console.log('Context fetching complete:', contextSummary);
    console.log('Final context string length:', contextString.length);

    // Attach to request object
    req.ancestorContext = {
      contextString: contextString,
      nodes: ancestorNodes,
      summary: contextSummary
    };
    req.ancestorMedia = allMediaAttachments;
    
    next();

  } catch (error) {
    console.error('Error in fetchAncestorContext:', error);
    next(error);
  }
}

// Helper function to format context for AI prompt
function formatContextForAI(ancestorContext) {
  if (!ancestorContext || !ancestorContext.nodes) {
    return '';
  }

  const { nodes, summary } = ancestorContext;
  
  let prompt = `CONVERSATION CONTEXT (${summary.totalNodes} messages, depth: ${summary.depthReached}):\n\n`;
  
  nodes.forEach(node => {
    const label = node.isStartNode ? '🎯 CURRENT MESSAGE' : `📖 ${node.depth} levels back`;
    const mediaInfo = node.mediaCount > 0 ? ` 📎${node.mediaCount}` : '';
    
    prompt += `${label}${mediaInfo} - ${node.userName}:\n`;
    prompt += `"${node.content}"\n\n`;
  });
  
  if (summary.totalMedia > 0) {
    prompt += `📎 Total media attachments: ${summary.totalMedia}\n`;
  }
  
  return prompt;
}

const textSuggestionWithContext = async (text, ancestorContext = null, ancestorMedia = null, options = {}) => {
  try {
    if (!text) {
      throw new Error("Text field is required");
    }

    const {
      includeContext = true,
      responseStyle = 'conversational',
      maxTokens = 500,
      temperature = 0.7,
      focusOnMedia = false,
      contentType = 'general'
    } = options;

    let contextualPrompt = '';

    // Build context-aware prompt
    if (includeContext && ancestorContext && ancestorContext.nodes && ancestorContext.nodes.length > 0) {
      const contextString = formatContextForAI(ancestorContext);
      const totalMedia = ancestorMedia ? ancestorMedia.length : 0;
      const mediaTypes = ancestorMedia ? [...new Set(ancestorMedia.map(m => m.fileType))].join(', ') : '';

      contextualPrompt = `CONVERSATION CONTEXT:
${contextString}

${totalMedia > 0 ? `MEDIA ATTACHMENTS: ${totalMedia} files (${mediaTypes})\n` : ''}USER REQUEST: ${text}

Based on the above context and request, create an enhanced detailed prompt for content generation that:
- Incorporates relevant context from the conversation
- Maintains consistency with the discussion thread
${focusOnMedia && totalMedia > 0 ? '- References any relevant media mentioned' : ''}
- Uses ${responseStyle} style
${contentType !== 'general' ? `- Focuses on ${contentType} content` : ''}`;

    } else {
      contextualPrompt = `USER REQUEST: ${text}

Create an enhanced detailed prompt for content generation that:
- Uses ${responseStyle} style
${contentType !== 'general' ? `- Focuses on ${contentType} content` : ''}
- Provides comprehensive guidance for generating quality content`;
    }

    // Call OpenAI to get the enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a prompt engineering expert. Create enhanced, detailed prompts for content generation. Return ONLY the enhanced prompt, nothing else."
      }, {
        role: "user",
        content: contextualPrompt
      }],
      temperature: temperature,
      max_tokens: maxTokens
    });

    console.log("enhanced prompt", response.choices[0].message.content);
    // Return just the enhanced prompt string
    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error("Error generating enhanced prompt:", error);
    throw error;
  }
};



const promptEnhancerAI = async (prompt) => {
  try {
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    console.log('prompt',prompt);
    const userPrompt = "Improve this image generation prompt to create a more detailed, vivid, and artistic description:";
    const final_prompt = userPrompt + "\n\n" + prompt;

    const response = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: [{ role: "user", content: final_prompt }],
      temperature: 0.7,
      max_tokens: 500
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
      max_tokens: 300,
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error extracting image description:", error);
    return userPrompt; // Fallback to original prompt
  }
};

module.exports ={
    openai,
    model,
    describeImage,
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
    extractImageDescription,
    detectMimeType,
    getFirstNWords,
    extractContentText,
    extractMediaDescriptions,
    textSuggestionWithContext
};

