import React from "react";
import PostCardLazy from "./PostCardLazy"

const lowResUrl = "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/c5ec46fc7bfca1c5517ab227965b70b39e5c2c7982b07e69a6b9d7ab00132172"
const highResUrl = "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/23385b6f534061042600c9ffba9c31e834e3c7cf0e7f18b88985238711314f24"
const PostCard = ({post}) => {
    return (
        <div
            className="m-0 p-0 border-2  aspect-square overflow-hidden relative cursor-pointer"
        >
            <div className="h-full w-full">

                <PostCardLazy
                    post={post} lowResUrl= {lowResUrl} alt="post image"
                />
            </div>
        </div>

    )
}

export default PostCard;