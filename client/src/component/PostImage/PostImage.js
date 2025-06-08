import React, { useContext, useState } from "react";
import DragAndDrop from "./Component/DragDrop";
import AIContentFile from "./Component/AIContentFile";
import Description from "./Component/Description";
import { LoginContext } from "../ContextProvider/context";
import { PostContext } from "./PostContext";
import { useCroppedFile } from "./PostUtils";
import PostProvider from "./PostContext";
// import  PostContext  from "./PostContext";

const PostImageContent = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { loginData } = useContext(LoginContext);
  const { file, fileType, desc, completedCrop } = useContext(PostContext);
  const { setFile, setDesc, setFileType, setPreviewUrl, setShowCropper, setCompletedCrop, setRefreshKey,setAiPrompt } = useContext(PostContext);

  const getCroppedFile = useCroppedFile();
 
  const handleClear = () =>{
    setFile(null);
    setDesc("");
    setPreviewUrl(null);
    setFileType(null);
    setShowCropper(false);
    setCompletedCrop(null);
    setAiPrompt("");
  }

  const handleSubmit = async (e) => {
    try {
      if (!loginData) {
        alert("User not logged in");
        return;
      }

      if (!file) {
        alert("Please add a description or upload a file");
        return;
      }

      setIsUploading(true);
      console.log("Starting upload for file:", file?.name);
      console.log("File type:", file?.type);
      console.log("User ID:", loginData.validuserone?._id || loginData.validateUser?._id);

      // Process crop for images only
      let fileToUpload = file;
      if (completedCrop && fileType === 'image') {
        fileToUpload = await getCroppedFile();
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("userId", loginData.validuserone?._id || loginData.validateUser?._id);
      formData.append("desc", desc);

      // Log form data for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      const data = await fetch('http://localhost:8099/upload', {
        method: 'POST',
        body: formData
      });

      // Check if the response is valid
      if (!data.ok) {
        const errorText = await data.text();
        console.error("Server error:", data.status, errorText);
        throw new Error(`Server error: ${data.status} - ${errorText}`);
      }

      const res = await data.json();
      console.log("Upload response:", res);

      if (res.status === 201) {
        console.log("Upload successful:", res);
        // Check if fileType was properly stored
        console.log("Stored file type:", res.storePost.fileType);

        setFile(null);
        setDesc("");
        setPreviewUrl(null);
        setFileType(null);
        setShowCropper(false);
        setCompletedCrop(null);

        // Trigger refresh of posts list
        setRefreshKey(oldKey => oldKey + 1);

        alert("Post uploaded successfully!");
      } else {
        console.error("Upload failed:", res);
        alert(`Failed to upload post: ${res.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error during upload:", error);
      alert(`Upload error: ${error.message || "Unknown error occurred"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full h-full bg-bg_comment p-2 pt-0">
      <div className=" flex flex-col ">
        <div className="text-xl text-text_header p-4 pt-2">
           Upload your creativity
        </div>
        <div className="flex flex-row gap-2 ">
          <div className="w-2/5 h-full rounded-lg bg-bg_comment_box">
            <AIContentFile />
            <Description />
          </div>
          <div className="w-3/5 h-full">
            <DragAndDrop />
          </div>
        </div>
      </div>
      <div className="bg-bg_comment flex justify-end gap-4 mx-4 mt-4">
        <button
          onClick={handleClear}
          className="border border-gray-700 mt-2 bg-gray-500 p-2 px-8 text-white font-bold rounded-md hover:bg-gray-800 disabled:opacity-50"
          disabled={isUploading}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          className="border border-blue-700 mt-2 bg-like_color px-8 p-2 text-white font-bold rounded-md hover:bg-blue-800 disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Post"}
        </button>
      </div>
      
    </div>
  );
}

const PostImage = () => (
  <PostProvider>
    <PostImageContent />
  </PostProvider>
);

export default PostImage;