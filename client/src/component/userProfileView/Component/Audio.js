import React from "react";
import PostCard from "./PostCard"
import purl from "../../../asset/profile.jpg";




const Audio = ({data}) =>{

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4">
        {data?.map((post) => (
            <PostCard key={post._id} post={post} />
        ))}
         </div>

    )
}

export default Audio;