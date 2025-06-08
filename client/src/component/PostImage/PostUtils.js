// useGetCroppedFile.js
import { useContext } from "react";
import { PostContext } from "./PostContext";

export const useCroppedFile = () => {
  const { completedCrop, canvasRef, imageRef, file, originalFileRef } = useContext(PostContext);

  return async () => {
    if (!completedCrop || !imageRef.current || !canvasRef.current) {
      return file;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pixelRatio = window.devicePixelRatio || 1;
    const width = completedCrop.width;
    const height = completedCrop.height;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      imageRef.current,
      sourceX, sourceY,
      sourceWidth, sourceHeight,
      0, 0, width, height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const fileName = originalFileRef.current?.name || "cropped-file";
        const fileExt = fileName.split(".").pop();
        const croppedFileName = `cropped-${fileName}`;
        const croppedFile = new File([blob], croppedFileName, {
          type: `image/${fileExt}`,
        });
        resolve(croppedFile);
      }, file.type);
    });
  };
};