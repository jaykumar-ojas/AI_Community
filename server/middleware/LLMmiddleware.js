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
      max_tokens: 1500,
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

    console.log('fetchAncestorContext - Input:', { startId, contextType });

    const maxDepth = 10;
    const maxWordsPerNode = 500;
    const maxTotalContextWords = 800; // Increased to accommodate topic/post context

    // Validation
    if (!startId) {
      console.log('Missing ID');
      return res.status(400).json({
        success: false,
        message: 'Missing ID for context fetching'
      });
    }

    // Decode the hashid only for topics, not for forum replies or post comments
    let decodedId;
    if (contextType === 'forumReply' && req.body.isTopic) {
      // Only decode if this is a topic (not a forum reply)
      try {
        decodedId = decodeId(startId);
        console.log('Decoded topic ID:', { original: startId, decoded: decodedId });
        
        // Handle case where decodeId returns an array
        if (Array.isArray(decodedId) && decodedId.length > 0) {
          decodedId = decodedId[0];
          console.log('Extracted first ID from array:', decodedId);
        }
        
      } catch (error) {
        console.log('Failed to decode topic hashid:', startId, error.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid hashid format for topic'
        });
      }

      // Validate the decoded ObjectId for topics
      if (!mongoose.Types.ObjectId.isValid(decodedId)) {
        console.log('Invalid decoded ObjectId for topic:', decodedId);
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format after decoding topic'
        });
      }
    } else {
      // For forum replies and post comments, use the ID as-is (no decoding needed)
      decodedId = startId;
      console.log('Using ID as-is (no decoding):', decodedId);
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
    let parentContextModel;
    let parentIdFieldName;
    let parentContext = null; // Initialize parentContext variable
    
    if (contextType === 'forumReply') {
      SelectedModel = ForumReply;
      parentIdField = 'parentReplyId';
      parentContextModel = ForumTopic;
      parentIdFieldName = 'topicId';
    } else if (contextType === 'comment') {
      SelectedModel = Comment;
      parentIdField = 'parentReplyId';
      parentContextModel = Post;
      parentIdFieldName = 'postId';
    }

    console.log('Selected model configuration:', { 
      modelName: SelectedModel.modelName,
      parentIdField,
      parentContextModel: parentContextModel.modelName,
      parentIdFieldName,
      originalId: startId,
      decodedId: decodedId,
      hashidDecoded: contextType === 'forumReply' && req.body.isTopic
    });

    // First, try to fetch the starting node to get the parent topic/post ID
    let startingNode = await SelectedModel.findById(decodedId)
      .select(`${parentIdFieldName} _id`)
      .lean();
    
    // If starting node not found, it might be a direct topic comment
    // Try to fetch the topic/post directly to see if this is a new comment
    if (!startingNode) {
      console.log('Starting node not found, checking if this is a direct topic/post comment');
      
      try {
        // Try to fetch the topic/post directly using the decoded ID
        const directParent = await parentContextModel.findById(decodedId)
          .select('_id title content desc imgUrl mediaAttachments userName userId createdAt')
          .lean();
        
        if (directParent) {
          console.log('Found direct parent (topic/post), treating as new comment');
          
          // Create a mock starting node for new comments
          startingNode = {
            _id: decodedId,
            [parentIdFieldName]: decodedId, // Self-reference for new comments
            isDirectComment: true
          };
          
          // Set parent context directly
          parentContext = directParent;
          
          console.log('Created mock starting node for direct comment:', {
            id: startingNode._id,
            parentId: startingNode[parentIdFieldName],
            isDirectComment: startingNode.isDirectComment
          });
        } else {
          console.log('Neither starting node nor direct parent found');
          return res.status(404).json({
            success: false,
            message: 'Starting node not found and not a valid topic/post for commenting'
          });
        }
      } catch (error) {
        console.error('Error checking for direct parent:', error);
        return res.status(500).json({
          success: false,
          message: 'Error checking for direct parent context'
        });
      }
    }

    // Fetch the parent topic/post context (if not already fetched from direct comment)
    if (!parentContext && startingNode[parentIdFieldName]) {
      try {
        parentContext = await parentContextModel.findById(startingNode[parentIdFieldName])
          .select('title content desc imgUrl mediaAttachments userName userId createdAt _id')
          .lean();
        
        if (parentContext) {
          console.log('Parent context fetched:', {
            type: contextType === 'forumReply' ? 'Topic' : 'Post',
            id: parentContext._id,
            title: parentContext.title || 'No title',
            contentLength: parentContext.content?.length || parentContext.desc?.length || 0
          });
        }
      } catch (error) {
        console.error('Error fetching parent context:', error);
      }
    }

    const ancestorNodes = [];
    let currentId = decodedId;
    let totalWords = 0;

    // Check if this is a direct comment (no existing reply/comment to build ancestors from)
    if (startingNode.isDirectComment) {
      console.log('Direct comment detected, skipping ancestor chain building');
      
             // Create a mock current node for direct comments
       const mockCurrentNode = {
         id: startingNode._id.toString(),
         depth: 0,
         priority: 20, // Highest priority for depth 0
         content: 'New comment being created',
         userName: 'Current User',
         userId: null,
         createdAt: new Date(),
         mediaCount: 0,
         mediaAttachments: [],
         contentImages: 0,
         isStartNode: true,
         isDirectComment: true
       };
      
      ancestorNodes.push(mockCurrentNode);
      console.log('Added mock current node for direct comment');
      
    } else {
      // Build ancestor chain from bottom to top for existing replies/comments
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
          priority: 20 - depth, // Higher priority for lower depth (depth 0 = priority 20, depth 10 = priority 10)
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
      } // End of for loop
    } // End of else block

    // Add parent context as the highest priority node if available
    if (parentContext) {
      let parentText = '';
      let parentMediaCount = 0;
      
             if (contextType === 'forumReply') {
         // Forum topic context
         parentText = parentContext.content || '';
         parentMediaCount = parentContext.mediaAttachments ? parentContext.mediaAttachments.length : 0;
         
         const parentNode = {
           id: parentContext._id.toString(),
           depth: -1, // Special depth for parent context
           priority: 25, // Highest priority for parent context
           content: getFirstNWords(parentText, maxWordsPerNode),
          userName: parentContext.userName || 'Unknown',
          userId: parentContext.userId?.toString(),
          createdAt: parentContext.createdAt,
          mediaCount: parentMediaCount,
          mediaAttachments: parentContext.mediaAttachments || [],
          contentImages: 0,
          isStartNode: false,
          isParentContext: true,
          title: parentContext.title || 'No title'
        };
        
        ancestorNodes.unshift(parentNode); // Add to beginning
        totalWords += parentNode.content.split(/\s+/).filter(word => word.length > 0).length;
        
        console.log('Added parent topic context:', {
          priority: parentNode.priority,
          content: parentNode.content.substring(0, 100) + '...',
          mediaCount: parentNode.mediaCount,
          title: parentNode.title
        });
             } else {
         // Post context
         parentText = parentContext.desc || '';
         parentMediaCount = parentContext.imgUrl ? 1 : 0;
         
         const parentNode = {
           id: parentContext._id.toString(),
           depth: -1, // Special depth for parent context
           priority: 25, // Highest priority for parent context
           content: getFirstNWords(parentText, maxWordsPerNode),
          userName: parentContext.userName || 'Unknown',
          userId: parentContext.userId?.toString(),
          createdAt: parentContext.createdAt,
          mediaCount: parentMediaCount,
          mediaAttachments: parentContext.imgUrl ? [{
            fileName: 'Post Image',
            fileType: 'image',
            fileUrl: parentContext.imgUrl,
            fileSize: 0,
            uploadedAt: parentContext.createdAt
          }] : [],
          contentImages: 0,
          isStartNode: false,
          isParentContext: true,
          title: 'Post Content'
        };
        
        ancestorNodes.unshift(parentNode); // Add to beginning
        totalWords += parentNode.content.split(/\s+/).filter(word => word.length > 0).length;
        
        console.log('Added parent post context:', {
          priority: parentNode.priority,
          content: parentNode.content.substring(0, 100) + '...',
          mediaCount: parentNode.mediaCount
        });
      }
    }

    // Sort by priority (highest first - closest ancestors)
    ancestorNodes.sort((a, b) => b.priority - a.priority);

    // Create structured context string
    const contextString = ancestorNodes
      .map(node => {
        let prefix;
        if (node.isParentContext) {
          prefix = contextType === 'forumReply' ? 'TOPIC' : 'POST';
        } else if (node.isStartNode) {
          if (node.isDirectComment) {
            prefix = 'NEW_COMMENT';
          } else {
            prefix = 'CURRENT';
          }
        } else {
          prefix = `ANCESTOR_${node.depth}`;
        }
        
        const mediaInfo = node.mediaCount > 0 ? ` [${node.mediaCount} media]` : '';
        const contentImgInfo = node.contentImages > 0 ? ` [${node.contentImages} inline images]` : '';
        const userInfo = ` (by ${node.userName})`;
        const titleInfo = node.title ? ` [${node.title}]` : '';
        
        return `${prefix}${titleInfo}${userInfo}${mediaInfo}${contentImgInfo}: ${node.content}`;
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
      rootUserName: ancestorNodes.length > 0 ? ancestorNodes[ancestorNodes.length - 1].userName : null,
      hasParentContext: !!parentContext,
      parentContextType: contextType === 'forumReply' ? 'Topic' : 'Post',
      parentContextId: parentContext?._id?.toString() || null,
      isDirectComment: startingNode?.isDirectComment || false
    };

    console.log('Context fetching complete:', contextSummary);
    console.log('Final context string length:', contextString.length);
    
    if (contextType === 'forumReply' && req.body.isTopic) {
      console.log('ID mapping (Topic - Hashid decoded):', { 
        originalHashid: startId, 
        decodedObjectId: decodedId 
      });
    } else if (contextType === 'forumReply') {
      console.log('ID mapping (Forum Reply - No decoding):', { 
        originalId: startId, 
        usedAsIs: decodedId 
      });
    } else {
      console.log('ID mapping (Post Comment - No decoding):', { 
        originalId: startId, 
        usedAsIs: decodedId 
      });
    }
    
    if (startingNode?.isDirectComment) {
      console.log('Direct comment mode - no existing reply/comment found, providing topic/post context only');
    }
    
    if (parentContext) {
      console.log('Parent context included:', {
        type: contextSummary.parentContextType,
        id: contextSummary.parentContextId,
        title: contextType === 'forumReply' ? parentContext.title : 'Post Content'
      });
    }

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

const textSuggestionWithContext = async (text, ancestorContext = null, ancestorMedia = null, options = {}) => {
  try {
    if (!text) {
      throw new Error("Text field is required");
    }

    const {
      includeContext = true,
      responseStyle = 'conversational',
      maxTokens = 10000,
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
  model: "gpt-4.1",
  messages: [{
    role: "system",
    content: `You are a Prompt Engineering Expert. 
Always rewrite the provided input into an enhanced, detailed, and optimized prompt for downstream content generation models.  

- If the input references images, visuals, or media (e.g., “what’s in this image”, “describe this photo”), do not mention missing inputs or limitations.  
- Instead, assume the necessary information exists and generate a strong enriched prompt accordingly.  
- Return only the enhanced prompt, with no explanations, disclaimers, or additional text.` 
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
      max_tokens: 500,
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

