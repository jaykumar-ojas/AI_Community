import React, { useContext } from "react";
import { PostContext } from "../PostContext";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { CrossIcon, RightIcon } from "../../../asset/icons";

const MAX_OUTPUT_SIZE = 1080; // Limit cropped output to max 1080px

const Cropper = () => {
  const {
    showCropper,
    previewUrl,
    fileType,
    completedCrop,
    crop,
    setCompletedCrop,
    setCrop,
    setShowCropper,
    setFile,
    setPreviewUrl,
    imageRef,
    canvasRef,
  } = useContext(PostContext);

  const cancelCrop = () => setShowCropper(false);

  const onImageLoad = (e) => {
    imageRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;

    // Clamp initial crop to avoid huge default crop sizes
    const cropWidth = Math.min(width, 800);
    const cropHeight = Math.min(height, 600);
    const x = (width - cropWidth) / 2;
    const y = (height - cropHeight) / 2;

    setCrop({ unit: "px", x, y, width: cropWidth, height: cropHeight });
  };

  const applyCrop = async () => {
    if (!completedCrop || !imageRef.current) return;

    const image = imageRef.current;
    const crop = completedCrop;

    // Create canvas
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let outputWidth = crop.width * scaleX;
    let outputHeight = crop.height * scaleY;

    // Scale down if larger than MAX_OUTPUT_SIZE
    if (outputWidth > MAX_OUTPUT_SIZE || outputHeight > MAX_OUTPUT_SIZE) {
      const scale = Math.min(
        MAX_OUTPUT_SIZE / outputWidth,
        MAX_OUTPUT_SIZE / outputHeight
      );
      outputWidth = outputWidth * scale;
      outputHeight = outputHeight * scale;
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        setFile(file);
        setShowCropper(false);

        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));

        resolve(file);
      }, "image/jpeg", 0.9);
    });
  };

  if (!showCropper || !previewUrl || fileType !== "image") return null;

  return (
    <div className="w-full h-full flex flex-col relative bg-transparent rounded-lg max-w-7xl p-4 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center text-lg text-text_header/70 tracking-wider">
        <div>Crop</div>
        <div className="flex justify-end mb-2 px-4">
          <button
            onClick={cancelCrop}
            className="text-white p-2 text-sm rounded-lg hover:bg-gray-700"
          >
            <CrossIcon />
          </button>
          <button
            onClick={applyCrop}
            className="p-2 text-white text-sm rounded-lg hover:bg-gray-700"
            disabled={!completedCrop?.width || !completedCrop?.height}
          >
            <RightIcon />
          </button>
        </div>
      </div>

      {/* Crop area */}
      <div className="flex-1 flex justify-center items-center">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          minWidth={100}
          minHeight={100}
          keepSelection={true}
          className="max-h-[58vh] max-w-full"
        >
          <img
            ref={imageRef}
            alt="Crop preview"
            src={previewUrl}
            onLoad={onImageLoad}
            className="max-h-[58vh] max-w-full object-contain"
          />
        </ReactCrop>
      </div>

      {/* Hidden canvas (not used directly) */}
      <canvas
        ref={canvasRef}
        style={{
          display: "none",
          width: completedCrop?.width ?? 0,
          height: completedCrop?.height ?? 0,
        }}
      />
    </div>
  );
};

export default Cropper;
