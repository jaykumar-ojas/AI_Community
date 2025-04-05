import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoginContext } from '../ContextProvider/context';

const ProfileCard = () => {
   const {loginData} = useContext(LoginContext);
   const [userPosts, setUserPosts] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const [activeTab, setActiveTab] = useState("all");
   const [filteredContent, setFilteredContent] = useState([]);
   const [profileFile, setProfileFile] = useState(null);
   const [backgroundFile, setBackgroundFile] = useState(null);
   const [profilePreview, setProfilePreview] = useState('');
   const [backgroundPreview, setBackgroundPreview] = useState('');
   const [uploadingProfile, setUploadingProfile] = useState(false);
   const [uploadingBackground, setUploadingBackground] = useState(false);
   
   // Fetch user posts when component mounts
   useEffect(() => {
     const validateUser = async () => {
       const token = localStorage.getItem("userdatatoken");
       if (!token) {
         console.log("No token found");
         return;
       }
       
       try {
         const data = await fetch("http://localhost:8099/validuser", {
           method: "GET",
           headers: {
             "Content-Type": "application/json",
             "Authorization": token,
           },
         });
         
         const res = await data.json();
         if (!res || res.status === 401) {
           console.log("Invalid user");
         } else {
           // If we have valid user data, fetch the posts
           fetchUserPosts(res.validuserone._id);
         }
       } catch (error) {
         console.error("Error validating user:", error);
       }
     };
     
     validateUser();
   }, []);
   
   const fetchUserPosts = async (userId) => {
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
         setUserPosts(data.userposts);
         setFilteredContent(data.userposts);
       }
     } catch (error) {
       console.error("Error fetching user posts:", error);
     } finally {
       setIsLoading(false);
     }
   };

   // Handle filtering content
   const filterContent = (tab) => {
     setActiveTab(tab);
     setFilteredContent(
       tab === "all"
         ? userPosts
         : userPosts.filter((item) => item.fileType === tab)
     );
   };

   // Handle delete post
   const handleDeletePost = async (postId, imgKey) => {
     if (!window.confirm('Are you sure you want to delete this post?')) {
       return;
     }
     
     try {
       const response = await fetch(`http://localhost:8099/delete/${postId}`, {
         method: 'DELETE',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ imgKey }),
       });
       
       const data = await response.json();
       
       if (data.status === 200) {
         // Remove the deleted post from state
         setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
         setFilteredContent(prevFiltered => prevFiltered.filter(post => post._id !== postId));
         alert('Post deleted successfully');
       } else {
         alert('Failed to delete post');
       }
     } catch (error) {
       console.error("Error deleting post:", error);
       alert('Error deleting post');
     }
   };

   // Handle profile picture change
   const handleProfilePictureChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     
     // Check file type
     const fileType = file.type.split('/')[0];
     if (fileType !== 'image') {
       alert('Please select an image file');
       return;
     }
     
     setProfileFile(file);
     
     // Create preview
     const reader = new FileReader();
     reader.onloadend = () => {
       setProfilePreview(reader.result);
     };
     reader.readAsDataURL(file);
   };
   
   // Handle background image change
   const handleBackgroundImageChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     
     // Check file type
     const fileType = file.type.split('/')[0];
     if (fileType !== 'image') {
       alert('Please select an image file');
       return;
     }
     
     setBackgroundFile(file);
     
     // Create preview
     const reader = new FileReader();
     reader.onloadend = () => {
       setBackgroundPreview(reader.result);
     };
     reader.readAsDataURL(file);
   };
   
   // Upload profile picture
   const uploadProfilePicture = async () => {
     if (!profileFile) {
       alert('Please select a profile picture first');
       return;
     }
     
     setUploadingProfile(true);
     try {
       const formData = new FormData();
       formData.append('file', profileFile);
       
       console.log('Uploading profile picture...');
       const response = await fetch('http://localhost:8099/upload-profile-picture', {
         method: 'POST',
         headers: {
           'Authorization': localStorage.getItem('userdatatoken'),
         },
         body: formData,
       });
       
       const data = await response.json();
       console.log('Profile picture upload response:', data);
       
       if (data.status === 200) {
         alert('Profile picture updated successfully');
         // Refresh user data
         window.location.reload();
       } else {
         alert(`Failed to update profile picture: ${data.error || 'Unknown error'}`);
       }
     } catch (error) {
       console.error("Error uploading profile picture:", error);
       alert(`Error uploading profile picture: ${error.message || 'Network error'}`);
     } finally {
       setUploadingProfile(false);
     }
   };
   
   // Upload background image
   const uploadBackgroundImage = async () => {
     if (!backgroundFile) {
       alert('Please select a background image first');
       return;
     }
     
     setUploadingBackground(true);
     try {
       const formData = new FormData();
       formData.append('file', backgroundFile);
       
       console.log('Uploading background image...');
       const response = await fetch('http://localhost:8099/upload-background-image', {
         method: 'POST',
         headers: {
           'Authorization': localStorage.getItem('userdatatoken'),
         },
         body: formData,
       });
       
       const data = await response.json();
       console.log('Background image upload response:', data);
       
       if (data.status === 200) {
         alert('Background image updated successfully');
         // Refresh user data
         window.location.reload();
       } else {
         alert(`Failed to update background image: ${data.error || 'Unknown error'}`);
       }
     } catch (error) {
       console.error("Error uploading background image:", error);
       alert(`Error uploading background image: ${error.message || 'Network error'}`);
     } finally {
       setUploadingBackground(false);
     }
   };

   // Render media based on file type
   const renderMedia = (post) => {
     if (!post.signedUrl) return null;
     
     switch (post.fileType) {
       case 'image':
         return (
           <img 
             src={post.signedUrl} 
             alt="Post" 
             className="w-full h-full object-cover"
             onError={(e) => {
               e.target.onerror = null;
               e.target.src = "https://via.placeholder.com/300?text=Image+Failed+to+Load";
             }}
           />
         );
       case 'video':
         return (
           <video 
             src={post.signedUrl} 
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
               src={post.signedUrl} 
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

   if (!loginData || !loginData.validuserone) {
     return <div className="text-center p-10">Loading user data...</div>;
   }

   return (
     <div className="min-h-screen bg-gray-200 dark:bg-gray-800">
       <div className="container mx-auto py-8 px-4">
         {/* Profile Card */}
         <div className="bg-white shadow-lg transform duration-200 ease-in-out rounded-lg overflow-hidden mb-8">
           <div className="h-48 overflow-hidden relative group">
             <img
               className="w-full h-full object-cover"
               src={backgroundPreview || loginData.validuserone.backgroundImageUrl || "https://images.unsplash.com/photo-1605379399642-870262d3d051?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"}
               alt="Background"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
               <label className="hidden group-hover:block cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md">
                 <span>Change Cover</span>
                 <input 
                   type="file" 
                   className="hidden" 
                   accept="image/*"
                   onChange={handleBackgroundImageChange}
                 />
               </label>
             </div>
           </div>
           {backgroundFile && (
             <div className="bg-gray-100 p-2 flex justify-between items-center">
               <span className="text-sm text-gray-600">New cover selected</span>
               <button 
                 className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                 onClick={uploadBackgroundImage}
                 disabled={uploadingBackground}
               >
                 {uploadingBackground ? 'Uploading...' : 'Save Cover'}
               </button>
             </div>
           )}
           <div className="flex justify-center px-5 -mt-12 relative">
             <div className="relative group">
               <img
                 className="h-32 w-32 bg-white p-2 rounded-full object-cover"
                 src={profilePreview || loginData.validuserone.profilePictureUrl || loginData.validuserone.image || "https://via.placeholder.com/150"}
                 alt="profile"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                 <label className="hidden group-hover:block cursor-pointer bg-white text-gray-800 px-2 py-1 rounded-lg shadow-md text-xs">
                   <span>Change</span>
                   <input 
                     type="file" 
                     className="hidden" 
                     accept="image/*"
                     onChange={handleProfilePictureChange}
                   />
                 </label>
               </div>
             </div>
           </div>
           {profileFile && (
             <div className="text-center mt-2">
               <button 
                 className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                 onClick={uploadProfilePicture}
                 disabled={uploadingProfile}
               >
                 {uploadingProfile ? 'Uploading...' : 'Save Profile Picture'}
               </button>
             </div>
           )}
           <div>
             <div className="text-center px-14">
               <h2 className="text-gray-800 text-3xl font-bold">{loginData.validuserone.userName}</h2>
               <a
                 className="text-gray-400 mt-2 hover:text-blue-500"
                 href="#"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 {loginData.validuserone.email}
               </a>
               <p className="mt-2 text-gray-500 text-sm">
                 Digital creator sharing photos, videos, and audio
               </p>
             </div>
             <hr className="mt-6" />
             <div className="flex bg-gray-50">
               <div className="text-center w-1/2 p-4 hover:bg-gray-100 cursor-pointer">
                 <p>
                   <span className="font-semibold">{userPosts.length} </span> Posts
                 </p>
               </div>
               <div className="border"></div>
               <div className="text-center w-1/2 p-4 hover:bg-gray-100 cursor-pointer">
                 <p>
                   <span className="font-semibold">2.0k </span> Following
                 </p>
               </div>
             </div>
           </div>
         </div>
         
         {/* User Posts Section */}
         <div className="bg-white shadow-lg rounded-lg overflow-hidden">
           <div className="p-4 border-b">
             <h2 className="text-xl font-semibold">My Content</h2>
           </div>
           
           {/* Filter Tabs */}
           <div className="flex border-b">
             <button
               className={`px-4 py-2 font-medium ${
                 activeTab === "all" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
               }`}
               onClick={() => filterContent("all")}
             >
               All
             </button>
             <button
               className={`px-4 py-2 font-medium ${
                 activeTab === "image" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
               }`}
               onClick={() => filterContent("image")}
             >
               Images
             </button>
             <button
               className={`px-4 py-2 font-medium ${
                 activeTab === "video" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
               }`}
               onClick={() => filterContent("video")}
             >
               Videos
             </button>
             <button
               className={`px-4 py-2 font-medium ${
                 activeTab === "audio" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
               }`}
               onClick={() => filterContent("audio")}
             >
               Audio
             </button>
           </div>
           
           {/* Content Grid */}
           <div className="p-4">
             {isLoading ? (
               <div className="flex justify-center items-center h-40">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
               </div>
             ) : filteredContent.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                 {filteredContent.map((post) => (
                   <div key={post._id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
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
                     <div className="p-3">
                       <p className="text-gray-600 text-sm truncate">{post.desc || "No description"}</p>
                       <div className="flex justify-between items-center mt-2">
                         <span className="text-xs text-gray-500 capitalize">{post.fileType}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-10">
                 <p className="text-gray-500 mb-4">You haven't posted anything yet</p>
                 <Link
                   to="/"
                   className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                 >
                   Create your first post
                 </Link>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   );
};

export default ProfileCard;
