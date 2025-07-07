
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from sentence_transformers import SentenceTransformer
from PIL import Image
import io
import os
from pydantic import BaseModel
from typing import List
from bson import ObjectId
import pymongo
from dotenv import load_dotenv


load_dotenv()


from middleware.pipeline import search_similar_images
from middleware.pipeline import search_similar_text



router = APIRouter()

#model

class SearchResult(BaseModel):
    similarity_score: float
    metadata: dict

class SearchTextResult(BaseModel):
    similarity_score: float
    metadata: dict


class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str

class SearchTextResponse(BaseModel):
    results: List[SearchTextResult]
    query: str


# Initialize CLIP model
model = SentenceTransformer('clip-ViT-B-32')

MONGODB_URL = os.getenv("MONGODB_URL")

mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"]  # Use your actual database name
posts_collection = db["userposts"]  # Collection containing posts with images
comments_collection = db["comments"]  # Collection containing comments
replies_collection = db["forumreplies"]  # Collection containing replies
embeddings_collection = db["image_embeddings"] 



@router.post("/search/image")
async def search_by_image(
    file: UploadFile = File(...),
    limit: int = Query(10, description="Number of results to return")
):
    """Search images by uploading an image"""
    try:
        # Read uploaded image
        image_data = await file.read()
        query_image = Image.open(io.BytesIO(image_data))
        
        # Encode query image
        query_features = model.encode(query_image)
        
        # Search in MongoDB
        results = await search_similar_images(query_features, limit)
        
        return SearchResponse(results=results, query=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching: {str(e)}")



@router.post("/search/image/posts")
async def search_posts_by_image(
    file: UploadFile = File(...),
    limit: int = Query(5, description="Number of results to return")
):
    """Search only posts images by uploading an image"""
    try:
        # Read uploaded image
        image_data = await file.read()
        query_image = Image.open(io.BytesIO(image_data))
        
        # Encode query image
        query_features = model.encode(query_image)
        
        # Search in MongoDB, filtering only for posts collection
        results = await search_similar_images(query_features, limit, collection_filter="posts")
        
        return SearchResponse(results=results, query=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching posts: {str(e)}")
    

@router.get("/search/text")
async def search_by_text(
    query: str = Query(..., description="Text query to search for"),
    limit: int = Query(5, description="Number of results to return")
):
    """Search images by text query"""
    try:
        # Encode query
        print(query)
        query_features = model.encode(query).tolist()
        print(len(query_features))
        
        # Search
        print("i m going for similarty search")
        results = await search_similar_text(query_features, limit)
    
        return SearchTextResponse(results=results, query=query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching: {str(e)}")


@router.get("/search/bypostid/{post_id}")
async def search_by_post_id(
    post_id: str,
    limit: int = Query(30, description="Number of results to return")
):
    """Search for images similar to the image in a specified post"""
    try:
        # Find the post with the given ID
        print("i m comint here but i gotta someproblem")
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        print("this is my post",post)
        if not post or "imgKey" not in post:
            raise HTTPException(status_code=404, detail="Post not found or post has no image")
        

        # # Get the image URL from the post
        # image_url = f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{post['imgKey']}"
        
        # # Download the image from S3
        # image = await download_image_from_s3(image_url, post['imgKey'])
        # if not image:
        #     raise HTTPException(status_code=404, detail="Could not retrieve image from post")
        
        # # Encode the image
        # query_features = model.encode(image)

        image_data =  embeddings_collection.find_one({"image_id":post_id})
        query_features= image_data['embedding']
        
        # Search for similar images only from posts collection
        results = await search_similar_images(query_features, limit, collection_filter="posts")
        
        return SearchResponse(results=results, query=f"Post ID: {post_id}")
    except Exception as e:
        print(f"Exception occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching: {str(e)}")
    
