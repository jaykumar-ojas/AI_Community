import React from 'react';
import { Link } from 'react-router-dom';

const ProfileContent = ({ 
  isLoading, 
  filteredContent, 
  handleDeletePost, 
  renderMedia 
}) => {
  return (
    <div className="p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <Link to={`/userPost/${post._id}`} className="block h-48 relative">
                {renderMedia(post)}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePost(post._id, post.imgKey);
                    }}
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Link>
              <div className="p-4">
                <p className="text-gray-700 text-sm truncate">{post.desc || "No description"}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 capitalize">{post.fileType}</span>
                  <span className="text-xs text-gray-400">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">You haven't posted anything yet</p>
          <Link
            to="/test2"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
          >
            Create your first post
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProfileContent; 