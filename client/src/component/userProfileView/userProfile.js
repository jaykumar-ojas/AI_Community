import UserHeader from "./Component/UserHedaer";
import TabProfile from "./Component/TabProfile";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
const baseUrl = process.env.REACT_APP_BASE_URL;


const fetchUserPosts = async (userId) => {
  const response = await fetch(`${baseUrl}/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  if (data.status !== 200) {
    throw new Error("Failed to fetch posts");
  }
  return data.userposts;
};

const UserProfile = () => {
  const { id } = useParams();
  const {
    data: posts = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["userPosts", id],
    queryFn: () => fetchUserPosts(id),
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-transparent relative p-0 sm:p-6"
    >
      <div className="max-w-7xl mx-auto bg-gray-100 dark:bg-nav_hover sm:rounded-xl shadow-lg overflow-hidden">
        <UserHeader posts={posts} isLoading={isLoading} isError={isError} error={error} />
        {/* Content Section */}
        <div className="p-4 border-gray-200 text-white">
          <TabProfile posts={posts} isLoading={isLoading} isError={isError} error={error} />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;