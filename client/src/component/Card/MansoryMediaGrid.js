import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MasonryMediaGrid = ({ url, type, onLoad }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const handleMediaLoad = () => {
    setMediaLoaded(true);
    if (onLoad) {
      onLoad(); // Notify parent component that media has loaded
    }
  };

  return (
    <div className="break-inside-avoid md:rounded-lg overflow-hidden bg-white shadow-sm relative">
      {/* Mobile Skeleton - takes full space and pushes content down */}
      {!mediaLoaded && (
        <div className="sm:hidden w-full">
          <Skeleton
            height={300}
            className="w-full rounded-lg"
            baseColor='#d1d5db'
            highlightColor='#6b7280'
          />
        </div>
      )}

      {/* Desktop Skeleton - absolute positioned overlay */}
      {!mediaLoaded && (
        <div className="hidden sm:block absolute top-0 left-0 w-full h-full z-0">
          <Skeleton
            height={300}
            className="w-full h-full rounded-lg"
            baseColor='#d1d5db'
            highlightColor='#6b7280'
          />
        </div>
      )}

      {/* Image */}
      {type === "image" && (
        <img
          src={url}
          alt="media"
          className={`w-full md:rounded-lg transition-opacity duration-300 ${
            mediaLoaded ? "opacity-100" : "opacity-0 sm:opacity-0"
          } ${!mediaLoaded ? "sm:absolute sm:top-0 sm:left-0" : ""}`}
          onLoad={handleMediaLoad}
          loading="lazy"
        />
      )}

      {/* Video */}
      {type === "video" && (
        <video
          className={`w-full rounded-lg transition-opacity duration-300 ${
            mediaLoaded ? "opacity-100" : "opacity-0 sm:opacity-0"
          } ${!mediaLoaded ? "sm:absolute sm:top-0 sm:left-0" : ""}`}
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
        <div className={`${mediaLoaded ? "block" : "hidden sm:block"} p-4 ${
          !mediaLoaded ? "sm:absolute sm:top-0 sm:left-0 sm:w-full" : ""
        }`}>
          <audio
            controls
            className="w-full"
            onCanPlayThrough={handleMediaLoad}
          >
            <source src={url} type="audio/mpeg" />
          </audio>
        </div>
      )}
    </div>
  );
};

export default MasonryMediaGrid;