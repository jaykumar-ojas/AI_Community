import React, { useContext, useRef, useState, useEffect } from "react";
import { CropIcon, CrossIcon, DragAndDropIcon } from "../../../asset/icons";
import RenderPreview from "./RenderPreview";
import { PostContext } from "../PostContext";
import Cropper from "./Cropper";
import { CubeSpinner } from "../../ui/CubeSpinner";

const DragAndDrop = () => {
  const {
    previewUrl,
    setPreviewUrl,
    fileType,
    setFileType,
    showCropper,
    setShowCropper,
    setCompletedCrop,
    setFile,
    isGeneratingImage,
  } = useContext(PostContext);

  const fileInputRef = useRef(null);
  const originalFileRef = useRef(null);

  // 🔥 rotating engaging messages
  const messages = [
  "✨ Your image canvas is forming...",
  "🎨 Adding colors and textures...",
  "🌀 Polishing details for perfection...",
  "⚡ Almost ready... hang tight!",
  "🔮 Summoning creativity from the void...",
  "🖌️ Painting strokes of imagination...",
  "🌌 Mixing stardust with colors...",
  "⚙️ Aligning tiny artistic gears...",
  "🎭 Giving life to your vision...",
  "📸 Adjusting the perfect frame...",
  "🧩 Assembling all the creative pieces...",
  "🌈 Splashing a bit more color magic...",
  "🔍 Perfecting the tiniest details...",
  "💡 Bright ideas are sparking up...",
  "🚀 Creativity is blasting off...",
  "🌟 Adding some final sparkles...",
  "🧵 Weaving imagination into reality...",
  "🎇 Almost there, your masterpiece awaits...",
  "🔔 Just a moment, magic is ringing...",
  "🏆 Done soon — a work of art is coming!"
];


  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (isGeneratingImage) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }, 5000); // change every 2.5s
      return () => clearInterval(interval);
    }
  }, [isGeneratingImage]);

  const processFile = (uploadedFile) => {
    if (uploadedFile) {
      originalFileRef.current = uploadedFile;
      setFile(uploadedFile);

      const type = uploadedFile.type.split("/")[0];
      setFileType(type);

      if (type === "image" || type === "video") {
        const preview = URL.createObjectURL(uploadedFile);
        setPreviewUrl(preview);
      } else if (type === "audio") {
        setPreviewUrl("/audio-icon.png");
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    processFile(uploadedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const uploadedFile = event.dataTransfer.files[0];
      processFile(uploadedFile);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // required to allow drop
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileType(null);
    setShowCropper(false);
    setCompletedCrop(null);
    originalFileRef.current = null;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-full w-full relative bg-transparent">
      {/* 🔥 Spinner with rotating messages */}
      {isGeneratingImage && !showCropper && !previewUrl ? (
        <div className="flex flex-col items-center justify-center w-full md:h-[67vh] h-[30vh] rounded-lg border-2 border-dashed border-gray-400 bg-black">
          <CubeSpinner size="w-10 h-10" color="orange" />

          {/* Rotating message */}
          <p className="mt-4 text-sm text-gray-300 animate-pulse">
            {messages[currentMessageIndex]}
          </p>

          {/* Fake preview placeholder */}
          <div className="mt-6 w-64 h-40 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-xs tracking-wide">
            Preview loading...
          </div>
        </div>
      )  : previewUrl ? (
        <div className="w-full h-full flex flex-col relative bg-transparent rounded-lg max-w-7xl p-4 pt-2">
          <div className="flex items-center justify-between p-2">
            {/* <div className="dark:text-text_header/70 text-gray-800 tracking-wider items-center text-md">
              Preview
            </div> */}
            {/* <div className="flex justify-end pt-0 mb-2 px-4">
              {fileType === "image" && (
                <button
                  onClick={() => setShowCropper(true)}
                  className="text-white text-sm p-2 rounded-lg hover:bg-gray-700"
                >
                  <CropIcon />
                </button>
              )}
              <button
                onClick={handleRemoveFile}
                className="text-white text-sm p-2 rounded-lg hover:bg-gray-700"
              >
                <CrossIcon />
              </button>
            </div> */}
          </div>
          <div className="flex-1 overflow-auto">
            <RenderPreview />
          </div>
        </div>
      ) : (
        <label
          htmlFor="dropzone-file"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="w-full md:h-[67vh] h-[30vh] cursor-pointer relative bg-transparent flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400"
        >
          <DragAndDropIcon />
          <p className="mb-2 md:text-sm text-xs  text-gray-700 dark:text-text_header dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Images, Videos, or Audio files
          </p>
          <input
            ref={fileInputRef}
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*"
          />
        </label>
      )}
    </div>
  );
};

export default DragAndDrop;
