import React from "react";
import UserIconCard from "./UserIconCard";
import UserNameCard from "./UserNameCard";
import PostCard from "../userProfileView/Component/PostCard";

const RelatedCard = ({ post }) => {
    return (
        <div className="flex flex-col w-[80%] border border-bg_comment my-2 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out max-w-5xl mr-auto ml-2 overflow-hidden">
            
            {/* Post Image - Maintains original aspect ratio */}
            <div className="w-[80%]">
                {/* If PostCard doesn't preserve aspect ratio, use img directly */}
                {post?.signedUrl || post?.imageUrl || post?.image ? (
                    <img 
                        src={post?.signedUrl || post?.imageUrl || post?.image} 
                        alt={post?.title || post?.desc || 'Post image'}
                        className="w-full h-auto object-contain"
                        loading="lazy"
                    />
                ) : (
                    <PostCard post={post} />
                )}
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* User Info */}
                <div className="flex flex-row items-center mb-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        <UserIconCard id={post?.userId} />
                    </div>
                    <div className="text-base font-semibold text-time_header">
                        <UserNameCard id={post?.userId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RelatedCard;