import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../ContextProvider/context";

const Uploader = () => {
  const {loginData} = useContext(LoginContext);
  // Sample user data
  const user = {
    name: loginData.validuserone.userName,
    bio: "Digital artist, filmmaker, and music producer. I love to create and share my work with the world.",
    avatar: loginData?.validuserone.image, // Placeholder avatar
    banner: "https://img.freepik.com/premium-photo/flat-futuristic-circuit-border-with-central-copy-space-concept-as-digital-frame-featuring-futuri_980716-646191.jpg", // Placeholder banner
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
  const navigate = useNavigate();
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
            onClick={() => navigate('/test2')}
            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
          >
            {"+"}
          </button>
        </div>


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
