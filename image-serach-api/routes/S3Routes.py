
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from middleware.embeddingGeneration import process_new_s3_object



router = APIRouter()







@router.post("/webhooks/s3-event")
async def process_s3_event(event: dict):
    """Webhook endpoint to process S3 events for new images"""
    try:
        for record in event.get("Records", []):
            if record.get("eventName", "").startswith("ObjectCreated:"):
                bucket = record.get("s3", {}).get("bucket", {}).get("name")
                key = record.get("s3", {}).get("object", {}).get("key")
                
                if bucket and key:
                    success = await process_new_s3_object(key, bucket)
                    if success:
                        print(f"Successfully processed new image: {key}")
        
        return {"message": f"Processed {len(event.get('Records', []))} S3 events"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing S3 event: {str(e)}")

