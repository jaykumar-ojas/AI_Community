import React, { useState, useRef, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const LazyImage = ({ 
  src, 
  alt = "image", 
  className = "", 
  onLoad, 
  onError,
  placeholder = null,
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [skeletonHeight, setSkeletonHeight] = useState(300);
  const [imageDimensions, setImageDimensions] = useState(null);
  const imgRef = useRef(null);

  // Preload image to get dimensions for accurate skeleton height
  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        // Get container width with a small delay to ensure it's rendered
        setTimeout(() => {
          const containerWidth = imgRef.current?.offsetWidth || 300;
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
      img.src = src;
    }
  }, [src]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Skeleton placeholder - only show when loading */}
      {!isLoaded && !hasError && !isInView && (
        <Skeleton
          height={skeletonHeight}
          className="w-full rounded-lg"
          baseColor='#f3f4f6'
          highlightColor='#e5e7eb'
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}

      {/* Actual image - only load when in view */}
      {isInView && src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Custom placeholder */}
      {placeholder && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
