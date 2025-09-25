import React from "react";
import UserIconCard from "./UserIconCard";
import UserNameCard from "./UserNameCard";
import PostCard from "../userProfileView/Component/PostCard";

const RelatedCard = ({ post }) => {
    return (
        <div className="flex flex-col w-full border border-gray-200 dark:border-bg_comment my-1 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out max-w-5xl mr-auto ml-2 overflow-hidden">
             <div className="p-2">
                {/* User Info */}
                <div className="flex flex-row items-center mb-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        <UserIconCard id={post?.userId} />
                    </div>
                    <div className="text-base font-semibold text-gray-800 dark:text-time_header">
                        <UserNameCard id={post?.userId} />
                    </div>
                </div>
            </div>
            {/* Post Image - Maintains original aspect ratio */}
            <div className="px-4">
                {/* If PostCard doesn't preserve aspect ratio, use img directly */}
                {post?.signedUrl || post?.imageUrl || post?.image ? (
                    <img 
                        src={post?.signedUrl || post?.imageUrl || post?.image} 
                        alt={post?.title || post?.desc || 'Post image'}
                        className="w-full max-h-[400px] object-contain"
                        loading="lazy"
                    />
                ) : (
                    // <div> im here</div>
                    <div className="w-full">
                        <PostCard post={post} />
                        </div>
                    
                )}
            </div>

            {/* Content Section */}
        </div>
    );
};

export default RelatedCard;