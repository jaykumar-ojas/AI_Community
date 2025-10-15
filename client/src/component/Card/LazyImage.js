import React, { useState, useRef, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const LazyImage = ({ 
  src, 
  alt = "image", 
  className = "", 
  onLoad, 
  onError,
  threshold = 0,      // <-- trigger on any visibility
  rootMargin = '100px' // preload before fully in viewport
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [skeletonHeight, setSkeletonHeight] = useState(300);
  const imgRef = useRef(null);

  // Preload image to get skeleton height
  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        const width = imgRef.current?.offsetWidth || 300;
        const aspectRatio = img.height / img.width;
        setSkeletonHeight(Math.round(width * aspectRatio));
      };
      img.onerror = () => setSkeletonHeight(300);
      img.src = src;
    }
  }, [src]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true); // start loading immediately
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) observer.observe(imgRef.current);
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
      {!isLoaded && !hasError && (
        <Skeleton
          height={skeletonHeight}
          className="w-full rounded-lg"
          baseColor='#f3f4f6'
          highlightColor='#e5e7eb'
        />
      )}

      {hasError && (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}

      {isInView && src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default LazyImage;
