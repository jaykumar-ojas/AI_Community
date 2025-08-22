import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import UserContent from "./UserContent";
import CommentReview from "./CommentReview";
import RelatedCard from "../Card/RelatedCard";
import UserCommentReply from "../UserReply/UserCommentReply";
import ModelList from "./CommentComponent/Model";
import AiIcons from "../../asset/AiIcons.png";

const baseUrl = process.env.REACT_APP_BASE_URL;

// Utility to fetch a post by ID if not found in cache
const fetchPostById = async (id) => {
  const res = await fetch(`${baseUrl}/getPostById`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: id }),
  });
  const data = await res.json();
  if (data.status === 201 && data.postdata) {
    return data.postdata;
  }
  throw new Error("Post not found");
};

// Fetch related posts
const fetchRelevantPosts = async (id) => {
  const res = await fetch(`http://localhost:8000/search/bypostid/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();

  return (data?.results || [])
    .map((value) => {
      if (!value || !value.metadata) return null;
      return {
        ...(value.metadata.data || {}),
        signedUrl: value.image_url || "",
      };
    })
    .filter(Boolean);
};

const PostContent = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showIcon,setShowICon] = useState(false);
  // Try to find the post in the existing cached posts list (from useInfiniteQuery)
  const postFromCache = queryClient.getQueryData(['posts'])?.pages
    ?.flatMap((page) => page.posts || []) // Adjust according to your actual structure
    ?.find((post) => post._id === id);

  // Get current post (from cache or backend)
  const {
    data: post,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id),
    initialData: postFromCache,
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  // Fetch relevant posts
  const {
    data: relevantPost = [],
    isLoading: isRelatedLoading,
  } = useQuery({
    queryKey: ['relatedPosts', id],
    queryFn: () => fetchRelevantPosts(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error.message || "Failed to load post."}</div>
        <button
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={refetch}
        >
          Try Again
        </button>
      </div>
    );
  }

  
  const handleIconClick = () => {
    setShowICon(!showIcon);
  }


  return (
    <div className="bg-transparent w-full overflow-x-hidden h-full">
      <div className="w-full justify-center flex flex-col md:flex-row">
        {/* Left Section */}
        <div className="relative w-full rounded-xl sm:w-[100%] md:w-[70%] h-[calc(100vh-3.5rem)] flex flex-col">
          {/* model icon list */}
          <div className="absolute z-50 left-0 m-4  mb-8 bottom-0">
            {showIcon && <ModelList/> }
            <button onClick={handleIconClick} className="justify-center m-2 items-center"><img src={AiIcons} alt="model" className="w-10 h-10 rounded-full"></img></button>
            </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box md:px-24 sm:px-0">
            <div className="mb-6">
              <UserContent post={post} />
            </div>

            <div className="flex-1 bg-bg_comment_box p-4 rounded-xl">
              <CommentReview />
            </div>
          </div>

          <div className="px-24">
            <UserCommentReply />
          </div>
        </div>

        {/* Right Section - Sticky Sidebar */}
        <div className="w-full overflow-y-auto h-[calc(100vh-3.5rem)] no-scrollbar bg-bg_comment_box rounded-xl hidden md:block md:w-[30%]">
          <div className="border border-gray-300 rounded-lg">
            <div className="text-lg text-md justify-center text-text_comment p-2 font-semibold">
              More Related Content
            </div>
            <div className="grid grid-cols-1">
              {isRelatedLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : relevantPost.length > 0 ? (
                relevantPost.map((item, index) => (
                  <RelatedCard key={item?._id || index} post={item} />
                ))
              ) : (
                <div className="col-span-3 text-center bg-bg_comment text-gray-500">
                  No related content found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostContent;
