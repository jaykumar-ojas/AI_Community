import React, { useMemo, useState } from "react";
import Audio from "./Audio";
import Video from "./Video";
import Image from "./Image";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const tabs = ["Image", "Video", "Audio", "Saved"];

const fetchUserPosts = async (userId) => {
  const response = await fetch("http://localhost:8099/get", {
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

const TabProfile = () => {
  const [activeTab, setActiveTab] = useState("Image");
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

  const image = useMemo(() => posts.filter((post) => post.fileType === "image"), [posts]);
  const video = useMemo(() => posts.filter((post) => post.fileType === "video"), [posts]);
  const audio = useMemo(() => posts.filter((post) => post.fileType === "audio"), [posts]);

  if (isLoading) return <div className="p-4 text-gray-500">Loading posts...</div>;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <>
      <div className="border-b pt-3 flex gap-6 border-gray-300">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-lg font-semibold transition-colors duration-200 ${
              activeTab === tab
                ? "border-b-4 border-gray-600 text-gray-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pb-16 mx-auto text-center border-gray-300">
        {activeTab === "Image" && <Image data={image} />}
        {activeTab === "Video" && <Video data={video} />}
        {activeTab === "Audio" && <Audio data={audio} />}
        {activeTab === "Saved" && <div>💾 Saved content goes here...</div>}
      </div>
    </>
  );
};

export default TabProfile;
