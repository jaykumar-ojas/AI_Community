import React from "react";
import PostCardLazy from "./PostCardLazy";
import { Link, useNavigate } from "react-router-dom";

const lowResUrl = "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/c5ec46fc7bfca1c5517ab227965b70b39e5c2c7982b07e69a6b9d7ab00132172";
const highResUrl = "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/23385b6f534061042600c9ffba9c31e834e3c7cf0e7f18b88985238711314f24";

const PostCard = ({ post }) => {
    const navigate = useNavigate();
  return (
    <div
       onClick={() => navigate(`/userPost/${post?._id}`)}
      className="relative m-0 p-0 border-2 aspect-square overflow-hidden cursor-pointer group"
    >
      <div className="relative h-full w-full">
        <PostCardLazy
          post={post}
         lowResUrl={lowResUrl}
          alt="post image"
        />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60 text-white text-sm p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <p className="">{post?.desc}</p>
      </div>
    </div>
  );
};

export default PostCard;
