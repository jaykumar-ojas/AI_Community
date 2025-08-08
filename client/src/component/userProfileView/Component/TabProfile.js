import React, { useMemo, useState } from "react";
import Audio from "./Audio";
import Video from "./Video";
import Image from "./Image";
import Saved from "./Saved";

const tabs = ["Image", "Video", "Audio", "Saved"];

const TabProfile = ({ posts = [], isLoading, isError, error }) => {
  const [activeTab, setActiveTab] = useState("Image");

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
                ? "border-b-4 border-gray-600 text-white"
                : "text-white hover:text-gray-700"
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
        {activeTab === "Saved" && <Saved/>}
      </div>
    </>
  );
};

export default TabProfile;
