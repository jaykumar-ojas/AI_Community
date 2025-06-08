import React, { useContext, useRef, useState } from "react";
import { CropIcon, CrossIcon, DragAndDropIcon } from "../../../asset/icons";
import RenderPreview from "./RenderPreview";
import { PostContext } from "../PostContext";
import Cropper from "./Cropper";

const DragAndDrop = () => {
    const {
        previewUrl,
        setPreviewUrl,
        fileType,
        setFileType,
        showCropper,
        setShowCropper,
        setCompletedCrop,
        setFile
    } = useContext(PostContext);

    const fileInputRef = useRef(null);
    const originalFileRef = useRef(null);

    const handleFileChange = (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            originalFileRef.current = uploadedFile;
            setFile(uploadedFile);

            const type = uploadedFile.type.split("/")[0];
            setFileType(type);

            if (type === "image" || type === "video") {
                const preview = URL.createObjectURL(uploadedFile);
                setPreviewUrl(preview);
            } else if (type === "audio") {
                setPreviewUrl("/audio-icon.png");
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setFileType(null);
        setShowCropper(false);
        setCompletedCrop(null);
        originalFileRef.current = null;

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex  h-full w-full">
            {showCropper ? (
                <div className="h-full w-full">
                    <Cropper />
                </div>
            ) : previewUrl ? (
                <div className="w-full h-full flex flex-col bg-bg_comment_box rounded-lg max-w-7xl p-4 pt-2">
                    <div className="flex items-center justify-between">
                    <div className="text-text_header/70 tracking-wider items-center text-md">
                        Preview
                        </div>
                    <div className="flex justify-end pt-0 mb-2 px-4">
                        {fileType === "image" && (
                            <button
                                onClick={() => setShowCropper(true)}
                                className="text-white text-sm p-2 rounded-lg hover:bg-gray-700"
                            >
                                <CropIcon/>
                            </button>
                        )}
                        <button
                            onClick={handleRemoveFile}
                            className="text-white text-sm p-2 rounded-lg hover:bg-gray-700"
                        >
                            <CrossIcon/>
                        </button>
                    </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <RenderPreview />
                    </div>
                </div>
            ) : (
                <label
                    htmlFor="dropzone-file"
                    className="w-full h-[67vh] cursor-pointer bg-bg_comment_box flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400"
                >
                    <DragAndDropIcon />
                    <p className="mb-2 text-sm text-text_header dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Images, Videos, or Audio files
                    </p>
                    <input
                        ref={fileInputRef}
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*"
                    />
                </label>
            )}
        </div>
    );
};

export default DragAndDrop;
