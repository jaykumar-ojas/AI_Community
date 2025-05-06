import React, { useContext, useState, useEffect, useRef } from "react";
import { LoginContext } from "../ContextProvider/context";
import RenderUserPosts from "./DisplayUserPost";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PostData = () => {
  const { loginData } = useContext(LoginContext);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [desc, setDesc] = useState("");
  const [fileType, setFileType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Cropping states - only for images, not videos
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ 
    unit: '%', 
    width: 100,
    aspect: 1/1 // 1:1 for images
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const originalFileRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  
  // Fetch user posts when component mounts or after successful upload
  useEffect(() => {
  }, [loginData]);
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Setup drag and drop event listeners
  useEffect(() => {
    const dropzone = dropzoneRef.current;
    
    if (!dropzone) return;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };
    
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragenter', handleDragEnter);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    
    return () => {
      dropzone.removeEventListener('dragover', handleDragOver);
      dropzone.removeEventListener('dragenter', handleDragEnter);
      dropzone.removeEventListener('dragleave', handleDragLeave);
      dropzone.removeEventListener('drop', handleDrop);
    };
  }, [dropzoneRef.current]);

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
      
      if(res.status === 201) {
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
    } catch(error) {
      console.error("Error during upload:", error);
      alert(`Upload error: ${error.message || "Unknown error occurred"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Convert canvas to blob/file for image cropping
  const getCroppedFile = async () => {
    if (!completedCrop || !imageRef.current || !canvasRef.current) {
      return file;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match Instagram standards
    const pixelRatio = window.devicePixelRatio || 1;
    
    // 1080x1080 for images
    const width = 1080;
    const height = 1080;
    
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    
    // Scale canvas display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context to account for ratio
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    // Draw with crop
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;
    
    ctx.drawImage(
      imageRef.current,
      sourceX, 
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );
    
    // Convert canvas to blob/file
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // Create a new file from the blob with original file name
        const fileName = originalFileRef.current?.name || "cropped-file";
        const fileExt = fileName.split('.').pop();
        const croppedFileName = `cropped-${fileName}`;
        const croppedFile = new File([blob], croppedFileName, { 
          type: `image/${fileExt}`
        });
        resolve(croppedFile);
      }, file.type);
    });
  };

  // Process file whether from input or drag and drop
  const processFile = (uploadedFile) => {
    if (uploadedFile) {
      originalFileRef.current = uploadedFile;
      setFile(uploadedFile);
      
      // Determine file type
      const type = uploadedFile.type.split('/')[0];
      setFileType(type);
      
      // Create preview for images and videos
      if (type === 'image' || type === 'video') {
        const preview = URL.createObjectURL(uploadedFile);
        setPreviewUrl(preview);
        
        // Show cropper for images only
        if (type === 'image') {
          setShowCropper(true);
        }
      } else if (type === 'audio') {
        // For audio, use a generic audio icon as preview
        setPreviewUrl('/audio-icon.png'); // You'll need to add this image to your public folder
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl); // Clean up the object URL
    }
    setPreviewUrl(null);
    setFileType(null);
    setShowCropper(false);
    setCompletedCrop(null);
    originalFileRef.current = null;
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onImageLoad = (e) => {
    imageRef.current = e.currentTarget;
    
    const { width, height } = e.currentTarget;
    // Initialize with centered crop
    const cropWidth = width > height ? height : width;
    const x = (width - cropWidth) / 2;
    const y = (height - cropWidth) / 2;
    
    setCrop({
      unit: 'px',
      x,
      y,
      width: cropWidth,
      height: cropWidth,
      aspect: 1 // Square aspect ratio for images
    });
  };

  const applyCrop = () => {
    if (completedCrop) {
      getCroppedFile().then(croppedFile => {
        setFile(croppedFile);
        setShowCropper(false);
        // Revoke old preview URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        const preview = URL.createObjectURL(croppedFile);
        setPreviewUrl(preview);
      });
    }
  };

  const cancelCrop = () => {
    setShowCropper(false);
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

  const renderCropper = () => {
    if (!showCropper || !previewUrl || fileType !== 'image') return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-auto">
          <h3 className="text-xl font-bold mb-4">
            Crop Image (1080×1080)
          </h3>
          
          <div className="flex flex-col items-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              className="max-h-[70vh] max-w-full"
            >
              <img
                ref={imageRef}
                alt="Crop preview"
                src={previewUrl}
                onLoad={onImageLoad}
                className="max-h-[70vh] max-w-full"
              />
            </ReactCrop>
            
            <canvas
              ref={canvasRef}
              style={{
                display: 'none',
                width: completedCrop?.width ?? 0,
                height: completedCrop?.height ?? 0
              }}
            />
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={cancelCrop}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={applyCrop}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!completedCrop?.width || !completedCrop?.height}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-whtie-700 border border-black min-h-screen max-w-screen p-4 m-4">
      <div className="flex flex-row justify-between gap-4 w-full">
        <div className="w-1/2 border-red-700">
          <div className="flex items-center justify-center w-full">
            <label
              ref={dropzoneRef}
              htmlFor="dropzone-file"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} border-dashed rounded-lg cursor-pointer bg-white dark:hover:bg-gray-100 dark:bg-white hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 transition-all duration-200`}
            >
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  {renderPreview()}
                  <div className="flex gap-2">
                    {fileType === 'image' && !showCropper && (
                      <button
                        onClick={() => setShowCropper(true)}
                        className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                      >
                        Crop Image
                      </button>
                    )}
                    <button
                      onClick={handleRemoveFile}
                      className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                    >
                      Remove File
                    </button>
                  </div>
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
                ref={fileInputRef}
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

      {renderCropper()}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
        <RenderUserPosts key={refreshKey} />
      </div>
    </div>
  );
};

export default PostData;