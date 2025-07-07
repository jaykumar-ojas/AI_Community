import pymongo
import os
from .Utils import json_serialize
from dotenv import load_dotenv
from bson import ObjectId



load_dotenv()






MONGODB_URL = os.getenv("MONGODB_URL")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
BUCKET = os.getenv("BUCKET")
REGION = os.getenv("REGION")
EMBEDDING_DIMENSION = 512  # Dimension of CLIP embeddings
PORT = os.getenv("PORT")


mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"]  # Use your actual database name
posts_collection = db["userposts"]  # Collection containing posts with images
comments_collection = db["comments"]  # Collection containing comments
replies_collection = db["forumreplies"]  # Collection containing replies
forum_topic_collection = db["forumtopics"] # Collection containing topics
embeddings_collection = db["image_embeddings"] #collection containing image_embedding
embeddings_text_collection = db["text_embeddings"]  # Collection for storing embeddings




async def get_text_metadata(image_id):
    """Get metadata for an image"""
    # First check in embeddings collection to get the source collection
    print("i am coming here",image_id)
    embedding_doc = embeddings_text_collection.find_one({"text_id": image_id})
    
    if not embedding_doc:
        return None
    print(len(embedding_doc))
    collection_name = embedding_doc.get("collection")
    parent_id = embedding_doc.get("parent_id")

    print("i m coming here for take data",collection_name)

    
    if collection_name == "posts":
       return get_text_metadata_from_post(image_id)
    
    elif collection_name == "comments":
        return get_text_metadata_from_comments(image_id,parent_id)
    
    elif collection_name == "replies":
       return get_text_metadata_from_replies(image_id,parent_id)
    
    elif collection_name == "forumTopic":
        return get_text_metadeata_from_forumTopic(image_id)
    
    return None

def get_text_metadata_from_post(text_id):

    post = posts_collection.find_one({"_id": ObjectId(text_id)})

    if post:
        return {
            "collection": "posts", 
            "data": json_serialize(post),
        }

def get_text_metadata_from_comments(text_id,parent_id):
    if parent_id:
        comment = comments_collection.find_one({"_id": ObjectId(parent_id)})
        if comment:
            # Find the specific attachment
            for attachment in comment.get("mediaAttachments", []):
                if str(attachment.get("_id", "")) == text_id:
                    return {
                        "collection": "comments", 
                        "data": json_serialize(comment),
                    }
                
def get_text_metadata_from_replies(text_id,parent_id):
    print("come to reply")
    reply = replies_collection.find_one({"_id": ObjectId(text_id)})
    if reply:
        # Find the specific attachment
        
        return {
            "collection": "replies", 
            "data": json_serialize(reply),
        }
                
def get_text_metadeata_from_forumTopic(text_id):
    topic = forum_topic_collection.find_one({"_id": ObjectId(text_id)})
    if topic:
        return {
            "collection": "forumTopic",
            "data":json_serialize(topic)
        }

    


                
    






# image data main function
async def get_image_metadata(image_id):
    """Get metadata for an image"""
    # First check in embeddings collection to get the source collection
    embedding_doc = embeddings_collection.find_one({"image_id": image_id})
    
    if not embedding_doc:
        return None
    
    collection_name = embedding_doc.get("collection")
    parent_id = embedding_doc.get("parent_id")
    
    if collection_name == "posts":
       return get_metadata_from_post(image_id)
    
    elif collection_name == "comments":
        return get_metadata_from_comments(image_id,parent_id)
    
    elif collection_name == "replies":
       return get_metadata_from_replies(image_id,parent_id)
    
    return None


def get_metadata_from_post(image_id):

    post = posts_collection.find_one({"_id": ObjectId(image_id)})

    if post:
        return {
            "collection": "posts", 
            "data": json_serialize(post),
        }
    
def get_metadata_from_comments(image_id,parent_id):
    if parent_id:
        comment = comments_collection.find_one({"_id": ObjectId(parent_id)})
        if comment:
            # Find the specific attachment
            for attachment in comment.get("mediaAttachments", []):
                if str(attachment.get("_id", "")) == image_id:
                    return {
                        "collection": "comments", 
                        "data": json_serialize(comment),
                    }
                

def get_metadata_from_replies(image_id,parent_id):
    if parent_id:
        reply = replies_collection.find_one({"_id": ObjectId(parent_id)})
        if reply:
            # Find the specific attachment
            for attachment in reply.get("mediaAttachments", []):
                if str(attachment.get("_id", "")) == image_id:
                    return {
                        "collection": "replies", 
                        "data": json_serialize(reply),
                    }

    





# main function to extract text from mongodb may be its comment post or forum
def extract_text_from_mongodb():
    """Extract all images from MongoDB collections that don't have embeddings yet"""
    text_data = []

    # extract image from post
    post_data = extract_text_from_postCollection()

    # extract image content from comment image data
    comment_data = extract_text_from_commentCollection()

    # extract image content from reply of forum replyCollection
    reply_data = extract_text_from_replyCollection()

    #extract text from forum topic
    topic_data = extract_text_from_forumTopic_collection()

    return [
        *post_data,
        *comment_data,
        *reply_data,
        *topic_data
    ]


def extract_text_from_postCollection():

    text_data=[]

    post_text = posts_collection.find()

    for post in post_text:
        # Check if embedding already exists
        if not embeddings_text_collection.find_one({"text_id": str(post["_id"])}):
            # For posts, the imgKey is directly the S3 key
            text_data.append({
                "id": str(post["_id"]),
                "desc":post["desc"],
                "collection": "posts"
            })

    return text_data

def extract_text_from_commentCollection():

    text_data = []

    comment_text = comments_collection.find()

    for comment in comment_text:
        if not embeddings_text_collection.find_one({"text_id": str(comment["_id"])}):
            if comment.get("desc") and len(comment["desc"]) > 0:
                text_data.append({
                    "id": str(comment["_id"]),
                    "desc":comment["desc"],
                    "parent_id": str(comment["_id"]),
                    "collection": "comments"
                })
    
    return text_data

def extract_text_from_replyCollection():

    text_data = []

    reply_text = replies_collection.find()
    print("this is reply")
    print(reply_text)
    for reply in reply_text:
        if not embeddings_text_collection.find_one({"text_id": str(reply["_id"])}):
            if reply.get("content") and len(reply["content"]) > 0:
        
                # Extract the key from fileName if available
                text_data.append({
                    "id": str(reply["_id"]),
                    "desc":reply["content"],
                    "parent_id": str(reply["_id"]),
                    "collection": "replies"
                })

    return text_data
    
def extract_text_from_forumTopic_collection():

    text_data =[]

    topic_text = forum_topic_collection.find()

    for topic in topic_text:
        if not embeddings_text_collection.find_one({"text_id": str(topic["_id"])}):
            if(topic["content"] and len( topic["content"]) >0):
                
                text_data.append({
                    "id" : str(topic["_id"]),
                    "desc" : topic["content"],
                    "collection" : "forumTopic"
                })
    
    return text_data













# main function for calling images
def extract_images_from_mongodb():
    """Extract all images from MongoDB collections that don't have embeddings yet"""
    image_data = []

    print("Starting image extraction from MongoDB...")
    
    # extract image from post
    post_data = extract_from_postCollection()
    print(f"Found {len(post_data)} images from posts")

    # extract image content from comment image data
    comment_data = extract_from_commentCollection()
    print(f"Found {len(comment_data)} images from comments")

    # extract image content from reply of forum replyCollection
    reply_data = extract_from_replyCollection()
    print(f"Found {len(reply_data)} images from replies")

    # Combine all data
    all_data = post_data + comment_data + reply_data
    print(f"Total images to process: {len(all_data)}")
    
    return all_data



def extract_from_postCollection():

    image_data=[]

    # Find all posts that have imgKey and it's not empty
    post_images = posts_collection.find({
        "imgKey": {
            "$exists": True, 
            "$ne": None
        }
    })

    post_images_list = list(post_images)
    print(f"Found {len(post_images_list)} posts with imgKey")

    for post in post_images_list:
        print(f"Processing post {post['_id']} with imgKey: {post.get('imgKey')}")
        
        # Check if embedding already exists
        existing_embedding = embeddings_collection.find_one({"image_id": str(post["_id"])})
        print(f"Checking for existing embedding for post {post['_id']}: {existing_embedding is not None}")
        if existing_embedding:
            print(f"Embedding already exists for post {post['_id']}")
            continue
            
        # For posts, use the existing imgUrl if available, otherwise construct from imgKey
        img_url = post.get('imgUrl') or f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{post['imgKey']}"
        
        image_data.append({
            "id": str(post["_id"]),
            "url": img_url,
            "key": post['imgKey'],  # Store the direct key for easier access
            "collection": "posts"
        })
        print(f"Added post {post['_id']} to image_data list")

    print(f"Returning {len(image_data)} images for processing")
    return image_data


def extract_from_commentCollection():

    image_data = []

    comment_images = comments_collection.find({"mediaAttachments": {"$exists": True, "$ne": []}})

    for comment in comment_images:

        if comment.get("mediaAttachments") and len(comment["mediaAttachments"]) > 0:
            for attachment in comment["mediaAttachments"]:
                if "fileUrl" in attachment and attachment.get("fileType", "").startswith("image/"):
                    # Use attachment ID as unique identifier
                    attachment_id = str(attachment.get("_id", ""))
                    if not embeddings_collection.find_one({"image_id": attachment_id}):
                        # Extract the key from fileName if available
                        key = attachment.get("fileName", "")
                        image_data.append({
                            "id": attachment_id,
                            "url": attachment["fileUrl"],
                            "key": key,  # Store the direct key if available
                            "parent_id": str(comment["_id"]),
                            "collection": "comments"
                        })
    
    return image_data


def extract_from_replyCollection():

    image_data = []

    reply_images = replies_collection.find({"mediaAttachments": {"$exists": True, "$ne": []}})

    for reply in reply_images:

        if reply.get("mediaAttachments") and len(reply["mediaAttachments"]) > 0:

            for attachment in reply["mediaAttachments"]:

                if "fileUrl" in attachment and attachment.get("fileType", "").startswith("image/"):
                    # Use attachment ID as unique identifier
                    attachment_id = str(attachment.get("_id", ""))
                    if not embeddings_collection.find_one({"image_id": attachment_id}):
                        # Extract the key from fileName if available
                        key = attachment.get("fileName", "")
                        image_data.append({
                            "id": attachment_id,
                            "url": attachment["fileUrl"],
                            "key": key,  # Store the direct key if available
                            "parent_id": str(reply["_id"]),
                            "collection": "replies"
                        })

    return image_data
    

