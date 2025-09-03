import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MasonryMediaGrid = ({ url, type }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  console.log(url);

  return (
    <div className="break-inside-avoid md:rounded-lg overflow-hidden bg-white shadow-sm relative">
      {/* Show Skeleton while media loads */}
      {!mediaLoaded && (
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <Skeleton
            height={300}
            className="w-full h-full rounded-lg"
            baseColor= '#d1d5db'
            highlightColor='#6b7280'
          />
        </div>
      )}

      {/* Image */}
      {type === "image" && (
        <img
          src={url}
          alt="media"
          className={`w-full md:rounded-lg transition-opacity duration-300 ${mediaLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setMediaLoaded(true)}
          loading="lazy"
        />
      )}

      {/* Video */}
      {type === "video" && (
        <video
          className={`w-full rounded-lg transition-opacity duration-300 ${mediaLoaded ? "opacity-100" : "opacity-0"}`}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setMediaLoaded(true)}
        >
          <source src={url} type="video/mp4" />
        </video>
      )}

      {/* Audio */}
      {type === "audio" && (
        <div className={`${mediaLoaded ? "block" : "hidden"} p-4`}>
          <audio
            controls
            className="w-full"
            onCanPlayThrough={() => setMediaLoaded(true)}
          >
            <source src={url} type="audio/mpeg" />
          </audio>
        </div>
      )}
    </div>
  );
};

export default MasonryMediaGrid;
