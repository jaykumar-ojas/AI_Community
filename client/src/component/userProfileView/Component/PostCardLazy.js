import React, { useEffect, useState } from "react";

const LazyImageWithBlurAndSpinner = ({ post, lowResUrl, alt }) => {
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const [highResLoaded, setHighResLoaded] = useState(false);

 console.log("this is my post",post);

  return (
    <div className="relative overflow-hidden w-full h-full bg-gray-100">
      {/* Spinner (visible immediately until high-res is loaded) */}
      {!highResLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-white bg-opacity-40">
          <div className="w-16 h-16 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Low-res blurred image */}
      <img
        src={lowResUrl}
        alt={alt}
        onLoad={() => setLowResLoaded(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${lowResLoaded && !highResLoaded ? "opacity-100 scale-100" : "opacity-0"
          }`}
        style={lowResLoaded && !highResLoaded ? { filter: "blur(1px)" } : {}}
      />

      {/* High-res image (after delay) */}
      {post?.fileType ==="image" && (
      <img
        src={post?.imgUrl}
        alt={alt}
        onLoad={() => setHighResLoaded(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 ${highResLoaded ? "opacity-100" : "opacity-0"
          }`}
      />
      )}

      {post?.fileType === "video" && (
        <video
          src={post?.imgUrl}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {post?.fileType === "audio" && (
        <div className="h-full w-full flex items-center justify-center bg-gray-800 p-4">
          <div className="p-4 bg-gray-900 rounded-lg shadow-lg w-80">
            <audio src={post?.imgUrl} className="w-full" controls />
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImageWithBlurAndSpinner;
