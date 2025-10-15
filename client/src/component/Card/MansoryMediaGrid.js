import React, { useState, useEffect, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import LazyImage from "./LazyImage";

const MasonryMediaGrid = ({ url, type, onLoad }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [skeletonHeight, setSkeletonHeight] = useState(300);
  const [imageDimensions, setImageDimensions] = useState(null);
  const containerRef = useRef(null);

  // Find the nearest scrollable ancestor (falls back to null -> viewport)
  const getScrollParent = (node) => {
    if (!node) return null;
    let parent = node.parentElement;
    while (parent) {
      // prefer explicit id used by the page if present
      if (parent.id === "scrollableDiv") return parent;
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (/(auto|scroll|overlay)/.test(overflowY)) return parent;
      parent = parent.parentElement;
    }
    return null;
  };

  // Preload image to get dimensions
  useEffect(() => {
    if (url && type === "image") {
      const img = new Image();
      img.onload = () => {
        // Get container width with a small delay to ensure it's rendered
        setTimeout(() => {
          const containerWidth = containerRef.current?.offsetWidth || 300;
          const aspectRatio = img.height / img.width;
          const calculatedHeight = Math.round(containerWidth * aspectRatio);
          
          // Ensure minimum and maximum heights for better UX
          const minHeight = 200;
          const maxHeight = 600;
          const finalHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
          
          setImageDimensions({ width: containerWidth, height: finalHeight });
          setSkeletonHeight(finalHeight);
        }, 100);
      };
      img.onerror = () => {
        // Fallback to random height if image fails to load
        const heights = [250, 300, 350, 400, 450, 500, 320, 380, 420, 280, 360, 340];
        const randomHeight = heights[Math.floor(Math.random() * heights.length)];
        setSkeletonHeight(randomHeight);
      };
      img.src = url;
    } else {
      // For non-image media, use random height
      const heights = [250, 300, 350, 400, 450, 500, 320, 380, 420, 280, 360, 340];
      const randomHeight = heights[Math.floor(Math.random() * heights.length)];
      setSkeletonHeight(randomHeight);
    }
  }, [url, type]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const rootElem = getScrollParent(containerRef.current);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        root: rootElem, // observe relative to the scrollable container if found
        rootMargin: "100px", // preload a bit earlier
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Resize observer to update skeleton height when container resizes
  useEffect(() => {
    if (!imageDimensions || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth !== imageDimensions.width) {
          // Recalculate height based on new width
          const aspectRatio = imageDimensions.height / imageDimensions.width;
          const newHeight = Math.round(newWidth * aspectRatio);
          const minHeight = 200;
          const maxHeight = 600;
          const finalHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
          setSkeletonHeight(finalHeight);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [imageDimensions]);

  // Reset loading state when URL changes
  useEffect(() => {
    if (url && shouldLoad) {
      setIsLoading(true);
      setMediaLoaded(false);
      setMediaError(false);
    }
  }, [url, shouldLoad]);

  const handleMediaLoad = () => {
    setMediaLoaded(true);
    setIsLoading(false);
    if (onLoad) {
      onLoad(); // Notify parent component that media has loaded
    }
  };

  const handleMediaError = () => {
    setMediaError(true);
    setIsLoading(false);
    setMediaLoaded(false);
  };

  // Show skeleton only when not loaded and not in error state
  const showSkeleton = !mediaLoaded && !mediaError && (isLoading || !shouldLoad);

  return (
    <div 
      ref={containerRef}
      className="break-inside-avoid md:rounded-lg overflow-hidden bg-white shadow-sm relative"
    >
      {/* Skeleton - only show when loading, not as overlay */}
      {showSkeleton && (
        <div className="w-full">
          <div className="relative overflow-hidden rounded-lg">
            <Skeleton
              height={skeletonHeight}
              className="w-full rounded-lg"
              baseColor='#f3f4f6'
              highlightColor='#e5e7eb'
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      )}

      {/* No URL State */}
      {!url && shouldLoad && (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No media available</span>
        </div>
      )}

      {/* Error State */}
      {mediaError && shouldLoad && (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load media</span>
        </div>
      )}

      {/* Image - Use LazyImage for better performance */}
      {type === "image" && shouldLoad && url && !mediaError && (
        <LazyImage
          src={url}
          alt="media"
          className="w-full md:rounded-lg"
          onLoad={handleMediaLoad}
          onError={handleMediaError}
          threshold={0.1}
          rootMargin="100px"
        />
      )}

      {/* Video */}
      {type === "video" && shouldLoad && url && !mediaError && (
        <video
          className={`w-full rounded-lg transition-opacity duration-300 ${
            mediaLoaded ? "opacity-100" : "opacity-0"
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
      {type === "audio" && shouldLoad && url && !mediaError && (
        <div className={`${mediaLoaded ? "block" : "hidden"} p-4`}>
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
    </div>
  );
};

export default MasonryMediaGrid;


