import { useContext } from "react";
import { PostContext } from "../PostContext";

const RenderPreview = () => {
    const {previewUrl,fileType} = useContext(PostContext); 
    if (!previewUrl) return null;

    if (fileType === 'image') {
        return (
            <img
                src={previewUrl}
                alt="Preview"
                className="h-full max-h-[58vh] w-full max-w-5xl  object-contain"
            />
        );
    } else if (fileType === 'video') {
        return (
            <div className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900">
                <video
                    src={previewUrl}
                    controls
                    className="h-[74vh] w-full max-w-5xl object-contain"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    Video
                </div>
            </div>
        );
    } else if (fileType === 'audio') {
        return (
            <div className="flex flex-col items-center mb-4 w-64 p-4 rounded-lg bg-gradient-to-br from-indigo-800 to-purple-700">
                <div className="bg-white bg-opacity-20 p-4 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                </div>
                <div className="w-full bg-white bg-opacity-10 p-2 rounded-lg">
                    <audio src={previewUrl} controls className="w-full" />
                </div>
                <div className="mt-2 text-white text-sm">Audio File</div>
            </div>
        );
    }

    return null;
};


export default RenderPreview;