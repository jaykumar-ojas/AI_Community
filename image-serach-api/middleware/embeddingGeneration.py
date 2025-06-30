import pymongo
from middleware.S3Bucket import download_image_from_s3
from sentence_transformers import SentenceTransformer
import datetime
import os
from dotenv import load_dotenv


load_dotenv()



MONGODB_URL = os.getenv("MONGODB_URL")
BUCKET = os.getenv("BUCKET")
REGION = os.getenv("REGION")

mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"] 

embeddings_collection = db["image_embeddings"]  # Collection for storing embeddings
embeddings_text_collection = db["text_embeddings"]
posts_collection = db["userposts"]  # Collection containing posts with images
comments_collection = db["comments"]  # Collection containing comments
replies_collection = db["forumreplies"]  # Collection containing replies


model = SentenceTransformer('clip-ViT-B-32')




async def generate_embedding_for_image(img_data):
    """Generate CLIP embedding for a single image and store it in MongoDB"""
    try:
        # Skip if embedding already exists
        existing = embeddings_collection.find_one({"image_id": img_data["id"]})
        if existing:
            return True
        
        # Download image from S3
        direct_key = img_data.get("key")
        image = await download_image_from_s3(img_data["url"], direct_key)
        
        if not image:
            print(f"Failed to download image for {img_data['id']}")
            return False
        
        # Generate embedding
        embedding = model.encode(image)
        
        # Store in MongoDB
        embeddings_collection.insert_one({
            "image_id": img_data["id"],
            "url": img_data["url"],
            "collection": img_data["collection"],
            "parent_id": img_data.get("parent_id"),
            "embedding": embedding.tolist(),
            "created_at": datetime.datetime.utcnow()
        })
        
        print(f"Generated embedding for image {img_data['id']} from {img_data['collection']}")
        return True
    except Exception as e:
        print(f"Error processing image {img_data['url']}: {str(e)}")
        return False
    

async def generate_embedding_for_text(text):
    """Generate CLIP embedding for a single image and store it in MongoDB"""
    try:
        # Skip if embedding already exists
        existing = embeddings_text_collection.find_one({"text_id": text["id"]})
        if existing:
            return False
        
        # Generate embedding
        embedding = model.encode(text["desc"])
        print("my embedding generate successully")
        # Store in MongoDB
        embeddings_text_collection.insert_one({
            "text_id": text["id"],
            "desc":text["desc"],
            "collection": text["collection"],
            "parent_id": text.get("parent_id"),
            "embedding": embedding.tolist(),
            "created_at": datetime.datetime.utcnow()
        })
        
        print(f"Generated embedding for image {text['id']} from {text['collection']}")
        return True
    except Exception as e:
        print(f"Error processing image {text['content']}: {str(e)}")
        return False
    
























async def process_new_s3_object(key, bucket):
    """Process a new image added to S3"""
    try:
        # Generate S3 URL
        image_url = f"https://{bucket}.s3.{REGION}.amazonaws.com/{key}"
        
        # Check if this image exists in our collections
        post = posts_collection.find_one({"imgKey": key})
        if post:
            img_data = {
                "id": str(post["_id"]),
                "url": image_url,
                "collection": "posts"
            }
            await generate_embedding_for_image(img_data)
            return True
            
        comment = comments_collection.find_one({"mediaAttachments.fileUrl": image_url})
        if comment:
            for attachment in comment["mediaAttachments"]:
                if attachment["fileUrl"] == image_url:
                    img_data = {
                        "id": str(attachment["_id"]),
                        "url": image_url,
                        "collection": "comments"
                    }
                    await generate_embedding_for_image(img_data)
                    return True
            
        reply = replies_collection.find_one({"mediaAttachments.fileUrl": image_url})
        if reply:
            for attachment in reply["mediaAttachments"]:
                if attachment["fileUrl"] == image_url:
                    img_data = {
                        "id": str(attachment["_id"]),
                        "url": image_url,
                        "collection": "replies"
                    }
                    await generate_embedding_for_image(img_data)
                    return True
            
        # If image not found in any collection, it might be new and not yet linked
        # Store the embedding with a temporary ID
        image = await download_image_from_s3(image_url)
        if image:
            embedding = model.encode(image)
            embeddings_collection.insert_one({
                "image_id": f"temp_{key.replace('/', '_')}",
                "url": image_url,
                "collection": "pending",
                "embedding": embedding.tolist(),
                "created_at": datetime.datetime.now(datetime.UTC)
            })
            print(f"Stored embedding for new image {key}")
            return True
            
        return False
    except Exception as e:
        print(f"Error processing new S3 object {key}: {str(e)}")
        return False



