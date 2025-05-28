import React from "react";

const ShowMedia = ({ attachment }) => {
  const { fileType, fileUrl, fileName } = attachment || {};

  const isImage = fileType?.startsWith("image/");
  const isVideo = fileType?.startsWith("video/");
  const isAudio = fileType?.startsWith("audio/");
  const isUnknown = !isImage && !isVideo && !isAudio;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
       {isImage && (
  <div className="w-full aspect-video bg-gray-100">
    <img
      src={fileUrl}
      alt={fileName}
      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      loading="lazy"
      onError={(e) => {
        console.error("Error loading image:", fileUrl);
        e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
      }}
    />
  </div>
)}

      {isVideo && (
        <div className="relative min-h-[80px] max-h-[120px]">
          <video
            controls
            className="w-full h-auto"
            style={{ maxHeight: "120px" }}
            src={fileUrl}
            preload="metadata"
            onError={() =>
              console.error("Error loading video:", fileUrl)
            }
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {isAudio && (
        <div className="p-2">
          <audio
            controls
            className="w-full"
            src={fileUrl}
            preload="metadata"
            onError={() =>
              console.error("Error loading audio:", fileUrl)
            }
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      )}

      {isUnknown && (
        <div className="p-2 flex items-center justify-center">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 text-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="truncate max-w-[100px]">{fileName}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default ShowMedia;
