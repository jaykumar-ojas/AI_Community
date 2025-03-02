import React, { useContext, useState, useEffect } from "react";
import { LoginContext } from "../ContextProvider/context"

const PostData = () => {
  const { loginData } = useContext(LoginContext);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [desc, setDesc] = useState("");
  const [fileType, setFileType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user posts when component mounts or after successful upload
  useEffect(() => {
    if (loginData && loginData.validuserone) {
      fetchUserPosts();
    }
  }, [loginData]);
  
  const fetchUserPosts = async () => {
    if (!loginData || !loginData.validuserone) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8099/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: loginData.validuserone._id }),
      });
      
      const data = await response.json();
      console.log("User posts:", data);
      
      if (data.status === 200) {
        setUserPosts(data.userposts);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePost = async (postId, imgKey) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8099/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imgKey }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert("Post deleted successfully");
        // Update the posts list
        fetchUserPosts();
      } else {
        alert("Failed to delete post: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error occurred while deleting post");
    }
  };
  
  const setChange = (e) => {
    setDesc(e.target.value);
  };

  const handleSubmit = async(e) => {
    try {
      if(!loginData) {
        alert("User not logged in");
        return;
      }
      
      if(desc === "" && !file) {
        alert("Please add a description or upload a file");
        return;
      }
      
      setIsUploading(true);
      console.log("Starting upload process...");
      console.log("File type:", fileType);
      console.log("File:", file);
      
      const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", loginData.validuserone._id);
        formData.append("desc", desc);
      
      const data = await fetch('http://localhost:8099/upload', {
        method: 'POST',
        body: formData
      });
      
      const res = await data.json();
      console.log("Upload response:", res);
      
      if(res.status === 201) {
        console.log("Upload successful:", res);
        // Check if fileType was properly stored
        console.log("Stored file type:", res.storePost.fileType);
        
        setFile(null);
        setDesc("");
        setPreviewUrl(null);
        setFileType(null);
        alert("Post uploaded successfully!");
        
        // Refresh the user's posts
        fetchUserPosts();
      } else {
        console.error("Upload failed:", res);
        alert("Failed to upload post. Please try again.");
      }
    } catch(error) {
      console.error("Error during upload:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  }

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      
      // Determine file type
      const type = uploadedFile.type.split('/')[0];
      setFileType(type);
      
      // Create preview for images and videos
      if (type === 'image' || type === 'video') {
      const preview = URL.createObjectURL(uploadedFile);
      setPreviewUrl(preview);
      } else if (type === 'audio') {
        // For audio, use a generic audio icon as preview
        setPreviewUrl('/audio-icon.png'); // You'll need to add this image to your public folder
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setFileType(null);
    if (previewUrl) {
    URL.revokeObjectURL(previewUrl); // Clean up the object URL
    }
  };

  const renderPreview = () => {
    if (!previewUrl) return null;
    
    if (fileType === 'image') {
      return (
        <img
          src={previewUrl}
          alt="Preview"
          className="h-48 w-auto mb-4 object-contain rounded-lg"
        />
      );
    } else if (fileType === 'video') {
      return (
        <div className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900">
          <video
            src={previewUrl}
            controls
            className="h-48 w-auto object-contain"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            Video
          </div>
        </div>
      );
    } else if (fileType === 'audio') {
      return (
        <div className="flex flex-col items-center mb-4 w-64 p-4 rounded-lg bg-gradient-to-br from-indigo-800 to-purple-700">
          <div className="bg-white bg-opacity-20 p-4 rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="w-full bg-white bg-opacity-10 p-2 rounded-lg">
            <audio src={previewUrl} controls className="w-full" />
          </div>
          <div className="mt-2 text-white text-sm">Audio File</div>
        </div>
      );
    }
    
    return null;
  };

  const renderUserPosts = () => {
    if (isLoading) {
      return <div className="text-center py-4">Loading your posts...</div>;
    }
    
    if (userPosts.length === 0) {
      return <div className="text-center py-4">You haven't created any posts yet.</div>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {userPosts.map(post => (
          <div key={post._id} className="border rounded-lg shadow-md overflow-hidden bg-white">
            <div className="p-2 bg-gray-100 flex justify-between items-center">
              <span className="font-medium">
                {new Date(post.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <button 
                onClick={() => handleDeletePost(post._id, post.imgKey)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
            
            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.fileType === 'image' && (
                <img 
                  src={post.signedUrl} 
                  alt="Post" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x280?text=Image+Not+Available";
                  }}
                />
              )}
              {post.fileType === 'video' && (
                <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
                  <video 
                    src={post.signedUrl} 
                    className="h-full w-full object-contain" 
                    controls
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black bg-opacity-40 rounded-full p-4 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    Video
                  </div>
                </div>
              )}
              {post.fileType === 'audio' && (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-indigo-800 to-purple-700 p-4">
                  <div className="bg-white bg-opacity-20 p-5 rounded-full mb-3 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  </div>
                  <div className="w-full bg-white bg-opacity-10 p-2 rounded-lg">
                    <audio src={post.signedUrl} controls className="w-full" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    Audio
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3">
              <p className="text-gray-700 line-clamp-2">{post.desc}</p>
              <p className="text-xs text-gray-500 mt-1">Type: {post.fileType}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-whtie-700 border border-black min-h-screen max-w-screen p-4 m-4">
      <div className="flex flex-row justify-between gap-4 w-full">
        <div className="w-1/2 border-red-700">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border border-white shadow-md rounded-lg cursor-pointer bg-white dark:hover:bg-white dark:bg-white hover:bg-white dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  {renderPreview()}
                  <button
                    onClick={handleRemoveFile}
                    className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Images, Videos, or Audio files
                  </p>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*"
              />
            </label>
          </div>
        </div>
        <div className="w-1/2 shadow-md flex flex-col p-2">
            <div className="w-full m-2 p-2 font-bold">
                Description
            </div>
            <div className="border border-bubblegum w-full h-full rounded-lg bg-pink-50">
                <textarea onChange={setChange}
                className="w-full h-full p-2 text-base border-0 bg-pink-50 text-left align-top outline-none focus:outline" 
                placeholder="speak to people" 
                value={desc}
                />
            </div>
            <button 
              onClick={handleSubmit} 
              className="w-full border border-blue-700 mt-2 mx-auto bg-blue-700 h-16 text-white font-bold rounded-md hover:bg-blue-800 disabled:opacity-50"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Submit"}
            </button>
        </div>
        </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
        {renderUserPosts()}
      </div>
    </div>
  );
};

export default PostData;
