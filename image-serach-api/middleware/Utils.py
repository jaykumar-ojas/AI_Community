from bson import ObjectId
import datetime






def get_general_pipeline(query_vector,collection_filter,limit):
    pipeline = [
        {
            "$addFields": {
                "similarity": {
                    "$reduce": {
                        "input": {"$zip": {"inputs": ["$embedding", query_vector]}},
                        "initialValue": 0,
                        "in": {"$add": ["$$value", {"$multiply": [{"$arrayElemAt": ["$$this", 0]}, {"$arrayElemAt": ["$$this", 1]}]}]}
                    }
                }
            }
        }
    ]

    if collection_filter:
        pipeline.append({"$match": {"collection": collection_filter}})
        
    pipeline.extend([
        {"$sort": {"similarity": -1}},
        {"$limit": limit}
    ])
    return pipeline


def json_serialize(obj):
    """Convert MongoDB documents to JSON-serializable dictionaries"""
    if isinstance(obj, dict):
        return {k: json_serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [json_serialize(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime.datetime):
        return obj.isoformat()
    else:
        return obj

