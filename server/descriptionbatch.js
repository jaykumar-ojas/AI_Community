const { MongoClient, ObjectId } = require('mongodb');
const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const pipeline = util.promisify(stream.pipeline);

// Load environment variables
dotenv.config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URL;
const DB_NAME = 'pixelmind';
const COLLECTION_NAME = 'forumreplies';
const OPENAI_API_KEY = process.env.OPEN_AI_KEY;

// Initialize clients
const mongoClient = new MongoClient(MONGODB_URI);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.REGION
});

const s3 = new AWS.S3();

// Function to download image to temp directory
async function downloadImage(url) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const fileName = path.join(tempDir, `temp-${Date.now()}.jpg`);
  const writer = fs.createWriteStream(fileName);

  try {
    // Extract the key from the URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1); // Remove leading slash

    // Get the object from S3
    const s3Object = await s3.getObject({
      Bucket: process.env.BUCKET,
      Key: key
    }).promise();

    // Write the file
    fs.writeFileSync(fileName, s3Object.Body);
    return fileName;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Function to generate image description using OpenAI
async function generateImageDescription(imagePath) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Please describe this image in detail." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString('base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating image description:', error);
    return 'No description available';
  }
}

// Main function
async function addImageDescriptions() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Find documents with image attachments
    const cursor = collection.find({
      'mediaAttachments': {
        $elemMatch: {
          'fileType': { $regex: /^image\// }
        }
      }
    });
    
    let count = 0;
    
    for await (const doc of cursor) {
      console.log(`Processing document ID: ${doc._id}`);
      
      for (let i = 0; i < doc.mediaAttachments.length; i++) {
        const attachment = doc.mediaAttachments[i];
        
        // Check if it's an image and doesn't have a description
        if (attachment.fileType.startsWith('image/') && !attachment.description) {
          console.log(`Processing image: ${attachment.fileName}`);
          
          try {
            // Download the image
            const imagePath = await downloadImage(attachment.fileUrl);
            
            // Generate description
            const description = await generateImageDescription(imagePath);
            
            // Update the document with the description
            await collection.updateOne(
              { _id: doc._id, 'mediaAttachments._id': attachment._id },
              { $set: { 'mediaAttachments.$.description': description } }
            );
            
            console.log(`Added description to image: ${attachment.fileName}`);
            
            // Delete temporary file
            fs.unlinkSync(imagePath);
            count++;
          } catch (error) {
            console.error(`Error processing image ${attachment.fileName}:`, error);
          }
        }
      }
    }
    
    console.log(`Completed! Added descriptions to ${count} images.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
addImageDescriptions();