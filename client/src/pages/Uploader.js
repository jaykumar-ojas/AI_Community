import React, { useState } from "react";

const Uploader = () => {
  // Sample user data
  const user = {
    name: "John Doe",
    bio: "Digital artist, filmmaker, and music producer. I love to create and share my work with the world.",
    avatar: "https://via.placeholder.com/150", // Placeholder avatar
    banner: "https://via.placeholder.com/1200x300", // Placeholder banner
    content: [
      {
        type: "image",
        title: "Abstract Art",
        src: "https://via.placeholder.com/600x400",
      },
      {
        type: "video",
        title: "3D Animation",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
      {
        type: "music",
        title: "Ambient Soundtrack",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
      {
        type: "story",
        title: "My Creative Journey",
        content:
          "I've been on an incredible journey exploring digital art, filmmaking, and music production...",
      },
    ],
  };

  const [activeTab, setActiveTab] = useState("all");
  const [filteredContent, setFilteredContent] = useState(user.content);
  const [contentList, setContentList] = useState(user.content);
  const [newContent, setNewContent] = useState({
    type: "image",
    title: "",
    src: "",
    content: "",
  });
  const [showUploadForm, setShowUploadForm] = useState(false); // Toggle form visibility

  // Handle filtering content
  const filterContent = (tab) => {
    setActiveTab(tab);
    setFilteredContent(
      tab === "all"
        ? contentList
        : contentList.filter((item) => item.type === tab)
    );
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContent((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectURL = URL.createObjectURL(file);
      setNewContent((prev) => ({ ...prev, src: objectURL }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setContentList((prev) => [...prev, newContent]);
    setNewContent({ type: "image", title: "", src: "", content: "" });
    setShowUploadForm(false); // Close the form after submission
    filterContent(activeTab); // Update filtered content after adding
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Banner */}
      <div className="relative">
        <img
          src={user.banner}
          alt="User Banner"
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-4 left-6 flex items-center">
          <img
            src={user.avatar}
            alt="User Avatar"
            className="w-24 h-24 rounded-full border-4 border-white"
          />
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-gray-200">{user.bio}</p>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowUploadForm((prev) => !prev)}
            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
          >
            {showUploadForm ? "✖" : "+"}
          </button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="p-6 bg-white rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">Upload New Content</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newContent.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full p-2 border rounded-lg"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  value={newContent.type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border rounded-lg"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="music">Music</option>
                  <option value="story">Story</option>
                </select>
              </div>
              {newContent.type !== "story" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    File
                  </label>
                  <input
                    type="file"
                    accept={
                      newContent.type === "image"
                        ? "image/*"
                        : newContent.type === "video"
                        ? "video/*"
                        : "audio/*"
                    }
                    onChange={handleFileUpload}
                    required
                    className="mt-1 block w-full p-2 border rounded-lg"
                  />
                </div>
              )}
              {newContent.type === "story" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <textarea
                    name="content"
                    value={newContent.content}
                    onChange={handleInputChange}
                    className="mt-1 block w-full p-2 border rounded-lg"
                    rows="4"
                    placeholder="Write your story"
                  />
                </div>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Upload
              </button>
            </form>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-4 mb-6">
          {["all", "image", "video", "music", "story"].map((tab) => (
            <button
              key={tab}
              onClick={() => filterContent(tab)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}s
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {item.type === "image" && (
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              {item.type === "video" && (
                <video controls className="w-full h-48">
                  <source src={item.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              {item.type === "music" && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <audio controls className="w-full">
                    <source src={item.src} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {item.type === "story" && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-700">{item.content}</p>
                </div>
              )}
              <div className="p-4 border-t">
                <p className="text-sm text-gray-500">
                  {item.type.toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Uploader;
