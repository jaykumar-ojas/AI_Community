import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";

const MasonryMediaGrid = ({ url, type, onLoad }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const handleMediaLoad = () => {
    setMediaLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div className="break-inside-avoid md:rounded-lg overflow-hidden bg-white shadow-sm relative">
  {/* Simple loader overlay */}

  {!mediaLoaded && ( <div className="md:hidden w-full"> <Skeleton height={300} className="w-full rounded-lg" baseColor='#d1d5db' highlightColor='#6b7280' /> </div> )}
  {!mediaLoaded && (
    <div
      className={`absolute md:block sm:relative top-0 left-0 w-full ${
        type === "image" || type === "video" ? "h-72 md:h-auto" : "h-auto"
      } bg-gray-200 animate-pulse z-10`}
    ></div>
  )}

  {/* Image */}
  {type === "image" && (
    <img
      src={url}
      alt="media"
      className={`w-full md:rounded-lg transition-opacity duration-300 ${
        mediaLoaded ? "opacity-100" : "opacity-0"
      }`}
      onLoad={handleMediaLoad}
      loading="lazy"
    />
  )}

  {/* Video */}
  {type === "video" && (
    <video
      className={`w-full rounded-lg transition-opacity duration-300 ${
        mediaLoaded ? "opacity-100" : "opacity-0"
      }`}
      autoPlay
      loop
      muted
      playsInline
      onLoadedData={handleMediaLoad}
    >
      <source src={url} type="video/mp4" />
    </video>
  )}

  {/* Audio */}
  {type === "audio" && (
    <div className={`${mediaLoaded ? "block" : "hidden"} p-4`}>
      <audio controls className="w-full" onCanPlayThrough={handleMediaLoad}>
        <source src={url} type="audio/mpeg" />
      </audio>
    </div>
  )}
</div>

  );
};

export default MasonryMediaGrid;
