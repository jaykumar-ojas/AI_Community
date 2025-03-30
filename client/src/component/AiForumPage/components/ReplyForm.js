import React, { useRef, useEffect } from 'react';

const ReplyForm = ({
  isReplyForm = false,
  content,
  setContent,
  selectedFiles,
  setSelectedFiles,
  handleFileSelect,
  handlePostReply,
  isLoading,
  isUploading,
  loginData,
  parentUserName,
  setReplyingTo,
  setReplyContent,
  setReplySelectedFiles,
  setParentUserName,
  setShowImageGenerator,
  setIsInReplyImageGenerator,
  setShowAITextResponse,
  autoFocus = false
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      handlePostReply();
    }
  };

  return (
    <div className={`${isReplyForm ? 'fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-20' : 'p-4 bg-white border-t border-gray-200'}`}>
      <div className={`${isReplyForm ? 'container mx-auto max-w-4xl' : ''}`}>
        {isReplyForm && (
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              Replying to <span className="font-medium text-blue-600">{parentUserName}</span>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
                setReplySelectedFiles([]);
                setParentUserName(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <div className="flex mb-2">
              <textarea
                ref={textareaRef}
                id={isReplyForm ? "replyTextarea" : "mainReplyTextarea"}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm overflow-y-auto whitespace-pre-wrap break-words"
                rows="3"
                placeholder="Write your reply..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                autoFocus={autoFocus}
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center ml-2"
                disabled={isLoading || !content.trim() || !loginData}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  isReplyForm ? 'Post Reply' : 'Post'
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label className="text-gray-500 hover:text-gray-700 cursor-pointer mr-3 flex items-center text-sm">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => handleFileSelect(e, isReplyForm)}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attach
                </label>
                
                {/* AI Image Generator Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowImageGenerator(true);
                    setIsInReplyImageGenerator(isReplyForm);
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm mr-3"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Generate Image
                </button>

                {/* AI Text Response Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAITextResponse(true);
                    setIsInReplyImageGenerator(isReplyForm);
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Response
                </button>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="text-xs text-gray-500">
                  {selectedFiles.length} file(s) selected
                </div>
              )}
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-gray-100 rounded p-1 text-xs flex items-center">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button 
                        type="button"
                        className="ml-1 text-gray-500 hover:text-red-500"
                        onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                    {file.type.startsWith('image/') && (
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                        <img 
                          src={file.url} 
                          alt="Preview" 
                          className="max-w-[150px] max-h-[150px] rounded shadow-lg border border-gray-200" 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplyForm; 