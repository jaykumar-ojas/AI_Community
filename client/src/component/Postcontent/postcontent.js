import React, { useEffect, useState } from "react";
import Comment from "./Comment";
import UserContent from "./UserContent";
import Card from "../Card/Card";
import { useNavigate, useParams } from "react-router-dom";

const PostContent = () => {
  const history = useNavigate();
  const {id} = useParams();
  const [post, setPost] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getPost = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching post with ID:", id);
      
      const data = await fetch('http://localhost:8099/getPostById', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: id
        })
      });
      
      const res = await data.json();
      console.log("Post API response:", res);
      
      if (res.status === 201) {
        setPost(res.postdata);
        console.log("Post data set:", res.postdata);
        console.log("Post ID for comments:", res.postdata._id);
      } else {
        console.error("Failed to fetch post data:", res);
        setError("Failed to load post. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("An error occurred while loading the post.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
        <button 
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={getPost}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg- max-w-screen mx-auto">
      <div className="relative w-full min-h-screen flex  p-4 px-16 gap-2">
        
        <div className="flex flex-col justify-between gap-2 h-full basis-[70%] ">
          {/* this is profile and image content */}
          <div className=" h-full w-full m-2">
            <UserContent post={post}></UserContent>
          </div>

          {/* this is suggestion section */}
          <div className="flex flex-col border border-gray-700 h-full w-full mx-auto p-2">
            <div className="p-4 w-full bg-white border rounded-lg">
              more related content
              </div>
            <div className="grid grid-cols-3 w-full p-2 gap-2 ">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex justify-center">
                i am here
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-black flex basis-[30%] m-2">
      <div className="h-full w-full">
        {post ? <Comment postId={post._id} /> : (
          <div className="h-full w-full flex items-center justify-center">
            Loading comments...
          </div>
        )}
      </div>
    </div>
      </div>
    </div>
  );
};

export default PostContent;



