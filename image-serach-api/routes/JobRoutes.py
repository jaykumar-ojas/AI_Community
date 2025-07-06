
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query

from middleware.embeddingGeneration import generate_embedding_for_image
from middleware.embeddingGeneration import generate_embedding_for_text
from middleware.extraction import extract_images_from_mongodb
from middleware.extraction import extract_text_from_mongodb

import pymongo
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv


load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

router = APIRouter()


mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"]  # Use your actual database name
posts_collection = db["userposts"]  # Collection containing posts with images
comments_collection = db["comments"]  # Collection containing comments
replies_collection = db["forumreplies"]  # Collection containing replies
embeddings_collection = db["image_embeddings"]  # Collection for storing embeddings


BUCKET = os.getenv("BUCKET")
REGION = os.getenv("REGION")

# building image embedding for all 
@router.post("/index/build")
async def build_index():
    """Build embeddings for all images in MongoDB that don't have embeddings yet"""
    try:
        # Extract images from MongoDB
        image_data = extract_images_from_mongodb()
        
        # Generate embeddings for each image
        success_count = 0
        for img_data in image_data:
            if await generate_embedding_for_image(img_data):
                success_count += 1
        
        return {"message": f"Generated embeddings for {success_count} images"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building index: {str(e)}")



@router.post("/index/build/text")
async def build_index_text():
    """Build embeddings for all text in MongoDB that don't have embeddings yet"""
    try:
        # Extract images from MongoDB
        text_data = extract_text_from_mongodb()
        
        # Generate embeddings for each image
        success_count = 0
        for text in text_data:
            if await generate_embedding_for_text(text):
                success_count += 1
        
        return {"message": f"Generated embeddings for {success_count} images"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building index: {str(e)}")








@router.post("/index/update-single")
async def update_single_image(image_id: str, collection: str = "posts"):
    """Generate embedding for a single image by ID"""
    try:
        # Find the image
        if collection == "posts":
            doc = posts_collection.find_one({"_id": ObjectId(image_id)})
        elif collection == "comments":
            doc = comments_collection.find_one({"_id": ObjectId(image_id)})
        elif collection == "replies":
            doc = replies_collection.find_one({"_id": ObjectId(image_id)})
        else:
            raise HTTPException(status_code=400, detail="Invalid collection")
        
        if not doc or (collection == "posts" and "imgKey" not in doc):
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Generate embedding
        if collection == "posts":
            img_data = {
                "id": image_id,
                "url": f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{doc['imgKey']}",
                "collection": collection
            }
        else:
            for attachment in doc["mediaAttachments"]:
                if str(attachment["_id"]) == image_id:
                    img_data = {
                        "id": image_id,
                        "url": attachment["fileUrl"],
                        "collection": collection
                    }
                    break
            else:
                raise HTTPException(status_code=404, detail="Image not found")
        
        if await generate_embedding_for_image(img_data):
            return {"message": f"Embedding generated for image {image_id}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.on_event("startup")
async def startup_event():
    
    await connection()

    # Create index on embedding vectors for faster similarity search
    embeddings_collection.create_index([("url", pymongo.ASCENDING)], unique=True)
    embeddings_collection.create_index([("image_id", pymongo.ASCENDING)])
    embeddings_collection.create_index([("collection", pymongo.ASCENDING)])
    
    # Create index on imageUrl for faster lookups
    posts_collection.create_index([("imgKey", pymongo.ASCENDING)])
    comments_collection.create_index([("mediaAttachments", pymongo.ASCENDING)])
    replies_collection.create_index([("mediaAttachments", pymongo.ASCENDING)])


async def connection():
    global db
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client["mydatabase"]  # Replace with your actual DB name
        # Ping the database to confirm connection
        await db.command("ping")
        print("✅ Connected to MongoDB.")
    except Exception as e:
        print("❌ Failed to connect to MongoDB:", e)


