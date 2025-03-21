import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoginContext } from "../../ContextProvider/context";

const UserContent =()=>{

    const {loginData} = useContext(LoginContext);
    const [activeTab, setActiveTab] = useState("all");
    const [filteredContent, setFilteredContent] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const {userId} = useParams();


     useEffect(() => {
        if (userId) {
            console.log("here alos",userId);
          fetchUserPosts(userId);
          console.log("this is userpost data",userPosts);
        }
      }, [loginData]);


    const fetchUserPosts = async (userId) => {
        console.log("i come here for data");
        if (!userId) {
          return;
        }
        
        setIsLoading(true);
        try {
          const response = await fetch('http://localhost:8099/get', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId }),
          });
          
          const data = await response.json();
          console.log("User posts:", data);
          
          if (data.status === 200) {
            console.log("i come here to set the data",data);
            setUserPosts(data.userposts);
            setFilteredContent(data.userposts);
          }
        } catch (error) {
          console.error("Error fetching user posts:", error);
        } finally {
          setIsLoading(false);
        }
      };


    // Render media based on file type
  const renderMedia = (post) => {
    if (!post?.signedUrl) return null;
    
    switch (post.fileType) {
      case 'image':
        return (
          <img 
            src={post?.signedUrl} 
            alt="Post" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
            //   e.target.src = "https://via.placeholder.com/300?text=Image+Failed+to+Load";
            }}
          />
        );
      case 'video':
        return (
          <video 
            src={post?.signedUrl} 
            className="w-full h-full object-contain"
            controls
            onError={(e) => {
              e.target.onerror = null;
              e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-200"><p class="text-gray-500">Video Failed to Load</p></div>';
            }}
          />
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
            <div className="text-center mb-2">Audio File</div>
            <audio 
              src={post?.signedUrl} 
              controls
              className="w-full"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.innerHTML = '<div class="text-gray-500">Audio Failed to Load</div>';
              }}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <p className="text-gray-500">Unsupported Media</p>
          </div>
        );
    }
   };


    const filterContent = (tab) => {
        setActiveTab(tab);
        setFilteredContent(
          tab === "all"
            ? userPosts
            : userPosts.filter((item) => item.fileType === tab)
        );
      };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "all" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
              }`}
              onClick={() => filterContent("all")}
            >
              All
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "image" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
              }`}
              onClick={() => filterContent("image")}
            >
              Images
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "video" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
              }`}
              onClick={() => filterContent("video")}
            >
              Videos
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "audio" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
              }`}
              onClick={() => filterContent("audio")}
            >
              Audio
            </button>
          </div>

          {/* Content Grid */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredContent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {console.log(filteredContent)};
                {filteredContent.map((post) => (
                  <div key={post?._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <Link to={`/userPost/${post?._id}`} className="block h-48 relative">
                      {renderMedia(post)}
                    </Link>
                    <div className="p-4">
                      <p className="text-gray-700 text-sm truncate">{post?.desc || "No description"}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 capitalize">{post?.fileType}</span>
                        <span className="text-xs text-gray-400">{new Date(post?.createdAt || Date.now()).toLocaleDateString()}</span>
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
        </div>
    )
}

export default UserContent;