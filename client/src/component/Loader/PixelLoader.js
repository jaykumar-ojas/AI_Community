import React, { useEffect, useState } from "react";

const gridSize = 20; // 20x20 grid = 400 pixels

const PixelLoader = ({ imgUrl }) => {
  const [pixels, setPixels] = useState(Array(gridSize * gridSize).fill("rgb(0, 0, 0)"));
  const [visiblePixels, setVisiblePixels] = useState([]);
  const sampleImg = imgUrl;

  useEffect(() => {
    const img = new Image();
    img.src = sampleImg;
    img.crossOrigin = "anonymous"; // Handle cross-origin issues if any

    // Log the URL to confirm
    console.log("Loading image from:", sampleImg);

    img.onload = () => {
      console.log("Image loaded successfully");
      
      // Create a canvas element
      const canvas = document.createElement("canvas");
      canvas.width = gridSize;
      canvas.height = gridSize;
      const ctx = canvas.getContext("2d");

      // Resize and draw the image to fit into the canvas (gridSize x gridSize)
      ctx.drawImage(img, 0, 0, gridSize, gridSize); // Resize the image to grid size
      const imgData = ctx.getImageData(0, 0, gridSize, gridSize).data;

      const pixelColors = [];
      // Extract RGB values for each pixel in the canvas
      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        pixelColors.push(`rgb(${r}, ${g}, ${b})`);
      }

      let revealIndex = 0;
      const revealInterval = setInterval(() => {
        revealIndex++;
        setVisiblePixels(pixelColors.slice(0, revealIndex));
        if (revealIndex >= pixelColors.length) clearInterval(revealInterval);
      }, 50);
    };

    img.onerror = (error) => {
      console.error("Error loading image:", error);
      // In case of error, fill with red pixels for indication
      setVisiblePixels(Array(gridSize * gridSize).fill("rgb(255, 0, 0)"));
    };
  }, [sampleImg]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      {/* Pixel Grid */}
      <div
        className={`grid gap-[1px]`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          width: "120px",
          height: "120px",
        }}
      >
        {Array(gridSize * gridSize)
          .fill()
          .map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-200`}
              style={{
                backgroundColor: visiblePixels[i] || "rgb(30, 30, 30)", // Fallback color
                width: "100%",
                height: "100%",
                transform: "scale(0.6)",
                transformOrigin: "center",
              }}
            />
          ))}
      </div>

      {/* Loading Text */}
      <div className="mt-4 text-gray-200 font-mono text-sm tracking-widest animate-pulse">
        LOADING
      </div>
    </div>
  );
};

export default PixelLoader;
