import React from "react";

const ShowSelectedFile = ({selectedFiles,setSelectedFiles}) => {
  return (
    <div>
      {selectedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="text-xs bg-gray-100 p-1 rounded flex items-center"
            >
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                type="button"
                className="ml-1 text-gray-500 hover:text-red-500"
                onClick={() =>
                  setSelectedFiles((files) =>
                    files.filter((_, i) => i !== index)
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowSelectedFile;
