
from .Utils import json_serialize
from .Utils import get_general_pipeline

from .extraction import get_image_metadata
from .extraction import get_text_metadata

import pymongo
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()


class SearchResult(BaseModel):
    similarity_score: float
    metadata: dict

MONGODB_URL = os.getenv("MONGODB_URL")

mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"] 
embeddings_collection = db["image_embeddings"]  # Collection for storing embeddings
embeddings_text_collection = db["text_embeddings"]




async def search_similar_images(query_features, limit=5, collection_filter=None):
    """Search for similar images using vector similarity"""
    # Find similar images
    results = []
    
    # Convert to list for MongoDB query
    query_vector = query_features
    
    # Use MongoDB aggregation to find similar vectors , return list object
    pipeline = get_general_pipeline(query_vector,collection_filter,limit)
    
    
    
    similar_docs = list(embeddings_collection.aggregate(pipeline))
    # Convert ObjectId to string
    similar_docs = json_serialize(similar_docs)
    
    # Process results
    for doc in similar_docs:
        image_id = doc["image_id"]
        collection_name = doc["collection"]
        
        # Skip temporary or pending images
        if image_id.startswith("temp_") or collection_name == "pending":
            continue
        
        # Get metadata
        metadata = await get_image_metadata(image_id)
        
        if metadata:
            results.append({
                "similarity_score": float(doc["similarity"]),
                "metadata": metadata
            })
    
    return results


async def search_similar_text(query_feature,limit=5,collection_filter=None):
    """Search for similar images using vector similarity"""
    # Find similar images
    results = []
    
    # Convert to list for MongoDB query
    query_vector = query_feature
    
    print("i m going to pipleline")
    # Use MongoDB aggregation to find similar vectors , return list object
    pipeline = get_general_pipeline(query_vector,collection_filter,limit)
    print("i m coming ot pipeline")
    
    
    print("going for similar docs")
    similar_docs = list(embeddings_text_collection.aggregate(pipeline))
    print("coming from similar docs")
    # Convert ObjectId to string
    similar_docs = json_serialize(similar_docs)
    print("after coming for json serilizable")
    
    # Process results
    for doc in similar_docs:
        text_id = doc["text_id"]
        collection_name = doc["collection"]
        
        # Skip temporary or pending images
        if text_id.startswith("temp_") or collection_name == "pending":
            continue
        
        # Get metadata
        metadata = await get_text_metadata(text_id)
        
        if metadata:
            results.append({
                "similarity_score": float(doc["similarity"]),
                "metadata": metadata
            })
    
    return results



