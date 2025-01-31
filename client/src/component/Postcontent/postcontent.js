import React, { useEffect, useState } from "react";
import Comment from "./Comment";
import UserContent from "./UserContent";
import Card from "../Card/Card";
import { useNavigate, useParams } from "react-router-dom";

const PostContent = () => {
  const history = useNavigate();
  const {id} = useParams();
  const [post,setPost] = useState();
  console.log(post);

  const getPost=async()=>{
    const data = await fetch('http://localhost:8099/getPostById',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        postId:id
      })
    });
    const res = await data.json();
    console.log(res);
    if(res.status===201){
      setPost(res.postdata);
    }
    console.log(post);
  }

  useEffect(()=>{
    getPost();
  },[]);



  return (
    <div className="min-h-screen bg- max-w-screen mx-auto">
      <div className="relative w-full h-full flex flex-col p-4 px-16 gap-2">
        {/* this is user post content */}
        <div className="flex justify-between gap-2 h-full w-full ">
          {/* this is profile and image content */}
          <div className=" h-full w-3/5 m-2">
            <UserContent post={post}></UserContent>
          </div>
          {/* this is comment section */}
          <div className=" h-full w-2/5 m-2">
            <Comment></Comment>
          </div>
        </div>
        {/* this is user suggestion content */}
        <div className="border border-gray-700 h-full w-full mx-auto p-2">
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
    </div>
  );
};

export default PostContent;
