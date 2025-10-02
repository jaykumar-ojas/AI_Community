import React, { useState } from "react";
import ModelIcon from "../AIchatbot/Component/ModelIcon";
import { CrossIcon } from "../../asset/icons";

export default function ImagePreviewCard({ imgUrl, modelInfo, onClose }) {
  const [loading, setLoading] = useState(true);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const isVideo = imgUrl && (imgUrl.endsWith(".mp4") || imgUrl.endsWith(".webm"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-3xl bg-white rounded-t-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-1 border-b border-gray-200 bg-gray-100">
          <div className="flex items-center space-x-2">
            {modelInfo && <ModelIcon modelName={modelInfo} />}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-xl px-2 font-bold"
          >
            <CrossIcon />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex items-center justify-center bg-black p-0.5 min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {imgUrl ? (
            isVideo ? (
              <video
                src={imgUrl}
                controls
                className="max-h-[60vh] w-auto object-contain"
                onLoadedData={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            ) : (
              <img
                src={imgUrl}
                alt="Preview"
                className="max-h-[60vh] w-auto object-contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            )
          ) : (
            <p className="text-center text-gray-500 py-10">No media provided</p>
          )}
        </div>
      </div>
    </div>
  );
}
