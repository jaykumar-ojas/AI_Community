import React from "react";
import UserIconCard from "./UserIconCard";
import UserNameCard from "./UserNameCard";
import PostCard from "../userProfileView/Component/PostCard";

const RelatedCard = ({ post }) => {
    return (
        <div className="flex flex-row items-center justify-between w-full p-4 border border-bg_comment my-2 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out max-w-6xl  mx-auto">
            {/* Left Section: User Info and Description */}
            <div className="flex flex-col justify-start min-h-44 w-[60%] gap-2 pr-6">
                {/* User Info */}
                <div className="flex flex-row items-center mb-3 ">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <UserIconCard id={post?.userId} />
                    </div>
                    <div className="text-base font-semibold text-time_header">
                        <UserNameCard id={post?.userId} />
                    </div>
                </div>

                {/* Post Description */}
                <div className="text-sm text-text_header leading-snug">
                    {post?.desc}
                    it.
                </div>
            </div>

            {/* Right Section: Post Preview */}
            <div className="w-[40%] h-40 rounded-xl overflow-hidden shadow-sm">
                <PostCard post={post} />
            </div>
        </div>
    );
};

export default RelatedCard;
