import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
mongo_client = pymongo.MongoClient(MONGODB_URL)
db = mongo_client["pixelmind"] 
posts_collection = db["userposts"]

# Test different queries to see what's happening
print("=== Testing Post Queries ===")

# Query 1: All posts
all_posts = list(posts_collection.find())
print(f"Total posts in collection: {len(all_posts)}")

# Query 2: Posts with imgKey field
posts_with_imgkey = list(posts_collection.find({"imgKey": {"$exists": True}}))
print(f"Posts with imgKey field: {len(posts_with_imgkey)}")

# Query 3: Posts with imgKey not null
posts_with_imgkey_not_null = list(posts_collection.find({"imgKey": {"$exists": True, "$ne": None}}))
print(f"Posts with imgKey not null: {len(posts_with_imgkey_not_null)}")

# Query 4: Posts with imgKey not empty
posts_with_imgkey_not_empty = list(posts_collection.find({
    "imgKey": {
        "$exists": True, 
        "$ne": None,
        "$ne": ""
    }
}))
print(f"Posts with imgKey not empty: {len(posts_with_imgkey_not_empty)}")

# Show some examples
print("\n=== Sample Posts ===")
for i, post in enumerate(posts_with_imgkey[:3]):
    print(f"Post {i+1}:")
    print(f"  ID: {post['_id']}")
    print(f"  imgKey: {post.get('imgKey')}")
    print(f"  imgUrl: {post.get('imgUrl')}")
    print(f"  desc: {post.get('desc', '')[:100]}...")
    print()

# Check for the specific post mentioned
specific_post = posts_collection.find_one({"_id": "68655dca40b8811e2948886a"})
if specific_post:
    print("=== Specific Post Found ===")
    print(f"ID: {specific_post['_id']}")
    print(f"imgKey: {specific_post.get('imgKey')}")
    print(f"imgUrl: {specific_post.get('imgUrl')}")
else:
    print("=== Specific Post NOT Found ===")
    # Try with ObjectId
    from bson import ObjectId
    specific_post = posts_collection.find_one({"_id": ObjectId("68655dca40b8811e2948886a")})
    if specific_post:
        print("Found with ObjectId conversion:")
        print(f"ID: {specific_post['_id']}")
        print(f"imgKey: {specific_post.get('imgKey')}")
        print(f"imgUrl: {specific_post.get('imgUrl')}")
    else:
        print("Still not found even with ObjectId") 