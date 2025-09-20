import React, { Children, createContext, useEffect, useRef, useState } from "react";


export const PostContext = createContext("");

const PostProvider = ({ children }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [completedCrop, setCompletedCrop] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [aiPrompt, setAiPrompt] = useState("");
    const [desc,setDesc] = useState("");
    const [selectedImageModel, setSelectedImageModel] = useState("");
    const [aiMetadata, setAiMetadata] = useState(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState("");
    const [crop, setCrop] = useState({ 
    unit: '%', 
    width: 100,
    height: 100,
    x: 5,
    y: 5
  });

    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const originalFileRef = useRef(null);
    const fileInputRef = useRef(null);
    const dropzoneRef = useRef(null);
    const imageLoaderRef = useRef(null);


    return (
        <>
            <PostContext.Provider value={{
                previewUrl, file, fileType, completedCrop, showCropper, refreshKey, crop,desc,aiPrompt,aiMetadata,
                setPreviewUrl, setFile, setFileType, setCompletedCrop, setShowCropper, setRefreshKey, setCrop, setDesc,setAiPrompt,setAiMetadata,
                imageRef, canvasRef, originalFileRef, fileInputRef, dropzoneRef,
                selectedImageModel, setSelectedImageModel,
                isGeneratingImage, setIsGeneratingImage,
                selectedAspectRatio, setSelectedAspectRatio,
                imageLoaderRef
            }}>
                {children}
            </PostContext.Provider>
        </>

    )
}

export default PostProvider;


















