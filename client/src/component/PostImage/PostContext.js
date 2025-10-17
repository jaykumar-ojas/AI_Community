import React, { createContext, useEffect, useRef, useState } from "react";

export const PostContext = createContext("");

const PostProvider = ({ children }) => {
  // ===================== STATE =====================
  const [previewUrl, setPreviewUrl] = useState(null); // base64 or image URL
  const [file, setFile] = useState(null); // actual File object for upload
  const [fileType, setFileType] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState("");
  const [aiMetadata, setAiMetadata] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("");
  const [crop, setCrop] = useState({
    unit: "%",
    width: 100,
    height: 100,
    x: 5,
    y: 5,
  });

  const [restored, setRestored] = useState(false);


  // ===================== REFS =====================
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const originalFileRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const imageLoaderRef = useRef(null);

  // ===================== RESTORE STATE ON MOUNT =====================
 useEffect(() => {
    const savedState = localStorage.getItem("postState");
    if (savedState) {
        const state = JSON.parse(savedState);
        setPreviewUrl(state.previewUrl || null);
        setFileType(state.fileType || null);
        setShowCropper(state.showCropper || false);
        setRefreshKey(state.refreshKey || 0);
        setAiPrompt(state.aiPrompt || "");
        setDesc(state.desc || "");
        setSelectedImageModel(state.selectedImageModel || "");
        setAiMetadata(state.aiMetadata || null);
        setIsGeneratingImage(state.isGeneratingImage || false);
        setSelectedAspectRatio(state.selectedAspectRatio || "");
        setCrop(state.crop || { unit: "%", width: 100, height: 100, x: 5, y: 5 });
    }
    setRestored(true); // mark restore complete
}, []);

  // ===================== SAVE STATE TO localStorage =====================
  useEffect(() => {
    if (!restored) return;
    const stateToSave = {
        previewUrl,
        fileType,
        showCropper,
        refreshKey,
        aiPrompt,
        desc,
        selectedImageModel,
        aiMetadata,
        isGeneratingImage,
        selectedAspectRatio,
        crop,
    };
    localStorage.setItem("postState", JSON.stringify(stateToSave));
}, [
    previewUrl,
    fileType,
    showCropper,
    refreshKey,
    aiPrompt,
    desc,
    selectedImageModel,
    aiMetadata,
    isGeneratingImage,
    selectedAspectRatio,
    crop,
    restored
]);

  // ===================== HELPER: Convert File to Base64 =====================
  const saveFileAsPreview = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result); // base64 string
    };
    reader.readAsDataURL(file);
  };

  // ===================== CLEAR FUNCTION =====================
  const clearPost = () => {
    setPreviewUrl(null);
    setFile(null);
    setFileType(null);
    setCompletedCrop(null);
    setShowCropper(false);
    setRefreshKey(0);
    setAiPrompt("");
    setDesc("");
    setSelectedImageModel("");
    setAiMetadata(null);
    setIsGeneratingImage(false);
    setSelectedAspectRatio("");
    setCrop({ unit: "%", width: 100, height: 100, x: 5, y: 5 });

    localStorage.removeItem("postState");
  };

  return (
    <PostContext.Provider
      value={{
        previewUrl,
        file,
        fileType,
        completedCrop,
        showCropper,
        refreshKey,
        crop,
        desc,
        aiPrompt,
        aiMetadata,
        setPreviewUrl,
        setFile,
        setFileType,
        setCompletedCrop,
        setShowCropper,
        setRefreshKey,
        setCrop,
        setDesc,
        setAiPrompt,
        setAiMetadata,
        imageRef,
        canvasRef,
        originalFileRef,
        fileInputRef,
        dropzoneRef,
        selectedImageModel,
        setSelectedImageModel,
        isGeneratingImage,
        setIsGeneratingImage,
        selectedAspectRatio,
        setSelectedAspectRatio,
        imageLoaderRef,
        saveFileAsPreview,
        clearPost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export default PostProvider;
