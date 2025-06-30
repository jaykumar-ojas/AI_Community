import os
import boto3
import io
import pymongo
from PIL import Image
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import datetime


load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")


mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"]  # Use your actual database name
posts_collection = db["userposts"]  # Collection containing posts with images
comments_collection = db["comments"]  # Collection containing comments
replies_collection = db["forumreplies"]  # Collection containing replies
embeddings_collection = db["image_embeddings"]  # Collection for storing embeddings

# Configuration

S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
BUCKET = os.getenv("BUCKET")
REGION = os.getenv("REGION")

model = SentenceTransformer('clip-ViT-B-32')


# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_ACCESS_KEY,
    region_name=REGION
)









# for downloading image for s3
async def download_image_from_s3(image_url, direct_key=None):
    """Download image from S3 bucket"""
    try:

        key = ""
        
        if direct_key:
            key = direct_key
        else:
            key = get_key_from_url(image_url)
        
       
        if "?" in key:
            key = key.split("?")[0]
            
        print(f"Extracted S3 key: {key} from URL: {image_url}")
        
        # Download file to memory
        response = s3_client.get_object(Bucket=BUCKET, Key=key)
        image_data = response['Body'].read()
        
        # Convert to PIL Image
        return Image.open(io.BytesIO(image_data))
    except Exception as e:
        print(f"Error downloading image from S3: {str(e)} for URL: {image_url}")
        return None
    
# supporter function
def get_key_from_url(image_url):
    key =""

    if "/" + BUCKET + ".s3" in image_url:
        # Format: https://bucketname.s3.region.amazonaws.com/key
        key = image_url.split(BUCKET + ".s3")[1].lstrip(".")
        if key.startswith("/"):
            key = key[1:]  # Remove leading slash
        if "amazonaws.com/" in key:
            key = key.split("amazonaws.com/")[1]
    elif "amazonaws.com/" + BUCKET + "/" in image_url:
        # Format: https://s3.region.amazonaws.com/bucketname/key
        key = image_url.split(BUCKET + "/")[1]
    else:
        # Direct key format
        key = image_url.split("/")[-1]
    
    return key



