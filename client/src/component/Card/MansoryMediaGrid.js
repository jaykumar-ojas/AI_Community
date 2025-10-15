import React, { useState, useEffect, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MasonryMediaGrid = ({ url, type, minHeight = 100, maxHeight = 600 }) => {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [height, setHeight] = useState(minHeight);


  // Lazy load with Intersection Observer (preload before fully visible)

  useEffect(() => {
    const rootElem = getScrollParent(containerRef.current);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },

      { rootMargin: "150px", threshold: 0.05 } // preload a bit early
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Preload image to calculate height
  useEffect(() => {
    if (!url || type !== "image" || !isInView) return;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const containerWidth = containerRef.current?.offsetWidth || 100;
      const aspectRatio = img.height / img.width;
      let calculatedHeight = Math.round(containerWidth * aspectRatio);
      calculatedHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
      setHeight(calculatedHeight);
      setLoaded(true);
    };
    img.onerror = () => {
      setError(true);
      setLoaded(true);
    };
  }, [url, type, isInView, minHeight, maxHeight]);

  const handleMediaLoad = () => setLoaded(true);
  const handleMediaError = () => {
    setError(true);
    setLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className="break-inside-avoid relative overflow-hidden rounded-lg bg-white shadow-sm flex items-center justify-center"
    >
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="flex items-center justify-center w-full h-full">
          <Skeleton
            height={200}
            className="w-full rounded-lg"
            baseColor="#f3f4f6"
            highlightColor="#e5e7eb"
          />
        </div>
      )}

      {/* Image */}
      {type === "image" && url && isInView && !error && (
        <img
          src={url}
          alt="media"
          className={`w-full rounded-lg transition-opacity duration-700 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
        />
      )}

      {/* Video */}
      {type === "video" && url && isInView && !error && (
        <video
          className={`w-full rounded-lg transition-opacity duration-700 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleMediaLoad}
          onError={handleMediaError}
        >
          <source src={url} type="video/mp4" />
        </video>
      )}

      {/* Audio */}
      {type === "audio" && url && isInView && !error && (
        <div className={`${loaded ? "block" : "hidden"} p-4`}>
          <audio
            controls
            className="w-full"
            onCanPlayThrough={handleMediaLoad}
            onError={handleMediaError}
          >
            <source src={url} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {/* Error fallback */}
      {error && (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load media</span>
        </div>
      )}
    </div>
  );
};

export default MasonryMediaGrid;
