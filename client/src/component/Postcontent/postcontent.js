import React, { useEffect, useState } from "react";
import UserContent from "./UserContent";
import { useNavigate, useParams } from "react-router-dom";
import CommentReview from "./CommentReview";
import ReplyCommentBox from "./CommentComponent/ReplyForComment";
import Card from "../Card/Card";

const PostContent = () => {
  const history = useNavigate();
  const {id} = useParams();
  const [post, setPost] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relevantPost,setRelevantPost]= useState();

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

  const getRelevantPost=async()=>{
    const data = await fetch(`http://localhost:8000/search/bypostid/${id}`,{
      method:'GET',
      headers:{
        'Content-Type':"application/json"
      }
    });

    const res = await data.json();
    setRelevantPost(res.results.map(value => ({
      ...value.metadata.data,
      signedUrl: value.image_url
    })));
  }

  console.log("this is relevant",relevantPost);

  useEffect(() => {
    getPost();
    getRelevantPost();
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
              {relevantPost && relevantPost.map((post)=>(
                <div key={post._id} className="flex justify-center">
                  <Card post={post} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col basis-[30%] m-2">
          {post ? (
            <>
              <div className="h-full w-full">
                <CommentReview />
              </div>
              <div >
                <ReplyCommentBox />
              </div>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              Loading comments...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PostContent;



