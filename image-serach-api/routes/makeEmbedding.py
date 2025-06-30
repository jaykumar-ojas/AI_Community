from middleware.extraction import extract_images_from_mongodb
from middleware.embeddingGeneration import generate_embedding_for_image

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
router = APIRouter()

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
