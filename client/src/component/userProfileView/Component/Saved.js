import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PostCard from "./PostCard";
const baseUrl = process.env.REACT_APP_BASE_URL;


const fetchSavedPosts = async ({ queryKey }) => {
  const [, userId, token] = queryKey;

  const response = await fetch(`${baseUrl}/savedPost/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch saved posts");
  }

  const data = await response.json();
  return data.savedPost;
};

const Saved = () => {
  const { id} = useParams();
  const userId = id;
  const token = localStorage.getItem("userdatatoken");

  const {
    data: savedPosts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["savedPosts", userId, token],
    queryFn: fetchSavedPosts,
    enabled: !!userId && !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes in milliseconds
  });

  if (isLoading) {
    return <div className="text-center mt-10">Loading saved posts...</div>;
  }

  if (isError) {
    return <div className="text-red-500 text-center mt-10">Error: {error.message}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 ">
      {savedPosts?.length > 0 ? (
        savedPosts.map((post) => <PostCard key={post._id} post={post} />)
      ) : (
        <div className="col-span-full text-center text-gray-500">No saved posts found.</div>
      )}
    </div>
  );
};

export default Saved;
