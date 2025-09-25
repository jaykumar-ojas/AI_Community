import React, { useContext, useState } from "react";
import DragAndDrop from "./Component/DragDrop";
import AIContentFile from "./Component/AIContentFile";
import Description from "./Component/Description";
import { LoginContext } from "../ContextProvider/context";
import { PostContext } from "./PostContext";
import { useCroppedFile } from "./PostUtils";
import PostProvider from "./PostContext";
import { Link, useNavigate } from "react-router-dom";
import { encodeId } from "../../utils/hashids";
import { ChevronDown } from "lucide-react";
import { useNotification } from "../ContextProvider/NotificationContext";
const baseUrl = process.env.REACT_APP_BASE_URL;

const PostImageContent = () => {
  const {showNotification} = useNotification();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { loginData } = useContext(LoginContext);
  const { file, fileType, desc, completedCrop, aiMetadata } =
    useContext(PostContext);
  const {
    setFile,
    setDesc,
    setFileType,
    setPreviewUrl,
    setShowCropper,
    setCompletedCrop,
    setRefreshKey,
    setAiPrompt,
    setAiMetadata,
  } = useContext(PostContext);

  const [showGenerateAI, setShowGenerateAI] = useState(false);
  

  const getCroppedFile = useCroppedFile();

  const handleClear = () => {
    setFile(null);
    setDesc("");
    setPreviewUrl(null);
    setFileType(null);
    setShowCropper(false);
    setCompletedCrop(null);
    setAiPrompt("");
    setAiMetadata(null);
  };

  const handleSubmit = async (e) => {
    try {
      if (!loginData) {
        showNotification("User not logged in");
        return;
      }

      if (!file) {
        showNotification("Please add a description or upload a file","error");
        return;
      }

      setIsUploading(true);

      // Process crop for images only
      let fileToUpload = file;
      if (completedCrop && fileType === "image") {
        fileToUpload = await getCroppedFile();
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append(
        "userId",
        loginData.validuserone?._id || loginData.validateUser?._id
      );
      formData.append("desc", desc);

      // Add AI metadata if present
      if (aiMetadata) {
        formData.append("aiModel", aiMetadata.model);
        formData.append("aiProvider", aiMetadata.provider);
        formData.append("aiPrompt", aiMetadata.prompt);
      }

      
      // Choose the appropriate upload endpoint
      const uploadEndpoint = aiMetadata
        ? `${baseUrl}/upload-ai`
        : `${baseUrl}/upload`;

      const data = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      // Check if the response is valid
      if (!data.ok) {
        const errorText = await data.text();
        console.error("Server error:", data.status, errorText);
        throw new Error(`Server error: ${data.status} - ${errorText}`);
      }

      const res = await data.json();
      // console.log("Upload response:", res);

      if (res.status === 201) {
        // console.log("Upload successful:", res);
        // Check if fileType was properly stored
        // console.log("Stored file type:", res.storePost.fileType);
     

        setFile(null);
        setDesc("");
        setPreviewUrl(null);
        setFileType(null);
        setShowCropper(false);
        setCompletedCrop(null);
        setAiMetadata(null);

        // Trigger refresh of posts list
        setRefreshKey((oldKey) => oldKey + 1);

        showNotification("Post uploaded successfully!", "success");
        // console.log(
        //   "this is post image id",
        //   res?.storePost?._id,
        //   res.storePost
        // );
        navigate(`/userPost/${res?.storePost?._id}`);
      } else {
        console.error("Upload failed:", res);
        showNotification(`Failed to upload post: ${res.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error("Error during upload:", error);
      showNotification(`Upload error: ${error.message || "Unknown error occurred"}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="hidden md:block">
        <div className="w-full h-full relative bg-transparent p-2 pt-0">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mx-2 mb-2">
              <div className="text-md text-gray-900 dark:text-text_header">
                Upload your creativity
              </div>
              <div className="relative bg-transparent flex justify-end gap-4 ">
                <button
                  onClick={handleClear}
                  className="border dark:border-gray-700 border-gray-400 mt-2 bg-gray-300 dark:bg-gray-500 p-2 px-8 text-gray-500 dark:text-white font-bold rounded-md hover:bg-gray-800 disabled:opacity-50"
                  disabled={isUploading}
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  className="border border-blue-700 mt-2 bg-like_color px-8 p-2 text-white font-bold rounded-md hover:bg-blue-800 disabled:opacity-50 "
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Post"}
                </button>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="w-2/5 h-full rounded-lg  bg-transparent">
                <AIContentFile />
                <Description />
              </div>
              <div className="w-3/5 h-full relative bg-transparent">
                <DragAndDrop />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="block md:hidden p-2 mb-16">
        {/* upload creativity */}
        <div className="flex justify-between items-center mx-2">
          <div className="text-md text-text_header">Upload your creativity</div>
          <div className="flex justify-between gap-2">
            <button
              onClick={handleClear}
              className="border border-gray-700 p-1 px-2 bg-gray-500 text-white font-bold rounded-md disabled:opacity-50"
              disabled={isUploading}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              className="border border-blue-700 p-1 px-2 bg-like_color text-white font-bold rounded-md 7disabled:opacity-50 "
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Post"}
            </button>
          </div>
        </div>

        {/* drag and drop and other things */}
        <div className="mt-4">
          <DragAndDrop />

          <div className="mt-2">
            <button
              onClick={() => setShowGenerateAI(!showGenerateAI)}
              className="flex w-full items-center justify-between px-4 py-2 bg-like_color text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all"
            >
              <span>Generate with AI</span>
              <ChevronDown
                className={`h-5 w-5 transform transition-transform duration-300 ${
                  showGenerateAI ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            {showGenerateAI && (
              <div className="mt-2">
                <AIContentFile />
              </div>
            )}
          </div>
          <div className="mt-2">
            <Description />
          </div>
        </div>
      </div>
    </>
  );
};

const PostImage = () => (
  <PostProvider>
    <PostImageContent />
  </PostProvider>
);

export default PostImage;
