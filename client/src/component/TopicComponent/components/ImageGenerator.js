import React, { useState } from "react";
import { API_BASE_URL, getAuthHeaders, handleAuthError } from "../../AiForumPage/components/ForumUtils";
import axios from "axios";

const ImageGenerator = ({ onClose, setNewReply, setSelectedFiles}) => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl,setGeneratedImageUrl] = useState();
  const [generatingImage,setGeneratingImage] = useState(false);
  const [error,setError] = useState();

  const handleGenerateImage = async (forReply = false) => {
    if (!imagePrompt.trim()) {
      alert('Please enter a prompt for the image');
      return;
    }
    setError(null);
    setGeneratingImage(true);
    try {
      // Show a loading message
      setGeneratedImageUrl('https://via.placeholder.com/400x300?text=Generating+Image...');
      
      const response = await axios.post(`${API_BASE_URL}/generateReplyImage`, {
        prompt: imagePrompt
      }, { headers: getAuthHeaders() });
      
      if (response.data.imageUrl) {
        setGeneratedImageUrl(response.data.imageUrl);
        console.log("Generated Image URL:", response.data.imageUrl);
        
        try {
          // Create a file object from the S3 URL
          const fileName = `ai-generated-image-${Date.now()}.png`;
          
          // Add the file to the selected files
            setSelectedFiles(prev => [...prev, {
              name: fileName,
              url: response.data.imageUrl,
              type: 'image/png'
            }]);
            setNewReply(prev => {
              const promptText = `[Generated image prompt: ${imagePrompt}]\n\n`;
              return prev ? prev + '\n\n' + promptText : promptText;
            });
          // Close the generator after successful attachment
          setTimeout(() => {
            setImagePrompt('');
            setGeneratedImageUrl('');
            setGeneratingImage('');
            onClose(false);
          }, 1500);
        } catch (fileError) {
          console.error('Error attaching image:', fileError);
          setError('Failed to attach the generated image. Please try generating the image again.');
          setGeneratedImageUrl(null);
        }
      } else if (response.data.error) {
        setError(response.data.error);
        setGeneratedImageUrl(null);
      } else {
        setError('Failed to generate image. Please try a different prompt.');
        setGeneratedImageUrl(null);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setGeneratedImageUrl(null);
      
      if (!handleAuthError(err, setError)) {
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Failed to generate image. Please try a different prompt or check your internet connection.');
        }
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Generate Image with AI</h3>
          <button
            onClick={() => {
              setImagePrompt("");
              onClose(false);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe the image you want
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              placeholder="E.g., A serene mountain landscape with a lake at sunset..."
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              disabled={generatingImage}
            />
          </div>

          {generatedImageUrl && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Generated Image:
              </p>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={generatedImageUrl}
                  alt="AI Generated"
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error("Error loading generated image");
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Image+Generation+Failed";
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={() => {
              onClose(false);
              setImagePrompt("");
              setGeneratedImageUrl("");
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={generatingImage}
          >
            Cancel
          </button>
          <button
            onClick={() => handleGenerateImage()}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            disabled={!imagePrompt.trim() || generatingImage}
          >
            {generatingImage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;

const CrossIcon = () => {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
};
