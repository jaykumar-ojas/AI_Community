import React, { useContext } from "react";
import { PostContext } from "../PostContext";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useCroppedFile } from "../PostUtils";
import { CrossIcon, RightIcon } from "../../../asset/icons";

const Cropper = () => {
    const {
        showCropper, previewUrl, fileType, completedCrop, crop,
        setCompletedCrop, setCrop, setShowCropper, setFile, setPreviewUrl,
        imageRef, canvasRef
    } = useContext(PostContext);

    const getCroppedFile = useCroppedFile();

    const cancelCrop = () => setShowCropper(false);

    const onImageLoad = (e) => {
        imageRef.current = e.currentTarget;
        const { width, height } = e.currentTarget;

        // Center crop
        const cropWidth = width;
        const cropHeight = height;
        const x = (width - cropWidth) / 2;
        const y = (height - cropHeight) / 2;

        setCrop({ unit: "px", x, y, width: cropWidth, height: cropHeight });
    };

    const applyCrop = async () => {
        if (completedCrop) {
            const croppedFile = await getCroppedFile();
            setFile(croppedFile);
            setShowCropper(false);

            if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(croppedFile));
        }
    };

    if (!showCropper || !previewUrl || fileType !== "image") return null;

    return (
        <div className="w-full h-full flex flex-col bg-bg_comment_box rounded-lg max-w-7xl p-4 pt-2">
            <div className="flex justify-between items-center text-lg text-text_header/70 tracking-wider">
                <div>
                    Crop
                </div>
                <div className="flex justify-end mb-2 px-4">
                    <button
                    onClick={cancelCrop}
                    className="text-white p-2 text-sm rounded-lg hover:bg-gray-700"
                >
                    <CrossIcon/>
                </button>
                <button
                    onClick={applyCrop}
                    className="p-2 text-white text-sm rounded-lg hover:bg-gray-700"
                    disabled={!completedCrop?.width || !completedCrop?.height}
                >
                    <RightIcon/>
                </button>
                </div>
                
            </div>

            <div className="flex-1  flex justify-center items-center">
                <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    minWidth={100}
                    minHeight={100}
                    keepRatio={false}
                    className="max-h-[58vh] max-w-full"
                >
                    <img
                        ref={imageRef}
                        alt="Crop preview"
                        src={previewUrl}
                        onLoad={onImageLoad}
                        className="max-h-[58vh] max-w-full object-contain"
                    />
                </ReactCrop>
            </div>

            <canvas
                ref={canvasRef}
                style={{
                    display: "none",
                    width: completedCrop?.width ?? 0,
                    height: completedCrop?.height ?? 0,
                }}
            />
        </div>
    );
};

export default Cropper;
