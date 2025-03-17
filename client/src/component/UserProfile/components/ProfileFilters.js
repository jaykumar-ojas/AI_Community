import React from 'react';

const ProfileFilters = ({ activeTab, filterContent }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
      <div className="flex border-b">
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "all" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("all")}
        >
          All
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "image" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("image")}
        >
          Images
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "video" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("video")}
        >
          Videos
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "audio" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("audio")}
        >
          Audio
        </button>
      </div>
    </div>
  );
};

export default ProfileFilters; 