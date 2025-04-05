import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import axios from "axios";
import { API_BASE_URL, formatDate, getAuthHeaders, handleAuthError, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import ShowMedia from "../components/ShowMedia";
import ReplyPostContent from "../components/ReplyPostContent";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import { useParams } from "react-router-dom";
import ReplyCommentBox from "./ReplyCommentBox";



const ShowReplyContent = ({reply,showViewMore,onViewMore}) => {
    const {topicId} = useParams();
    const {emitDeleteReply} = useWebSocket();
    const {loginData} = useContext(LoginContext);
    const [isLiked,setIsLiked] = useState();
    const [isDisliked,setIsDisLiked] = useState();
    const [isAuthor,setIsAuthor] = useState(false);
    const [replyLikes,setReplyLikes] = useState([]);
    const [replyDislikes,setReplyDislikes] = useState([]);
    const [error,setError] = useState();
    const [showReplyBox,setShowReplyBox] = useState(false);
    const [isLoading,setIsLoading]= useState(false);
    console.log("this is topicI",topicId);
  
   console.log(reply?._id,"here i am showing my reply data");
  
      useEffect(() => {
          if (reply && loginData) {
              console.log("Setting data dynamically...");
              setReplyLikes(reply?.likes);
              setReplyDislikes(reply?.dislikes);
              setIsAuthor(reply?.userId=== loginData?.validuserone._id);
          }
      }, [reply, loginData]);
  
      useEffect(() => {
          
          if (loginData?.validuserone?._id) {
              setIsLiked(replyLikes?.includes(loginData.validuserone._id));
              setIsDisLiked(replyDislikes?.includes(loginData.validuserone._id));
          }
      }, [replyLikes, replyDislikes, loginData]);


      const handleDeleteReply = async () => {
        if (!loginData || !loginData.validuserone) {
          setError('You must be logged in to delete a reply');
          return;
        }
    
        // Ask for confirmation before deleting
        if (!window.confirm("Are you sure you want to delete this reply? This action cannot be undone.")) {
          return;
        }
    
        try {
          setIsLoading(true);
          
          const response = await axios.delete(`${REPLIES_URL}/${reply?._id}`, {
            headers: getAuthHeaders()
          });
    
          if (response.status === 200) {
            // Emit socket event for reply deletion
            console.log("i emitting reply"); 
            emitDeleteReply(reply?._id, topicId);
          }
        } catch (error) {
          console.error('Error deleting reply:', error);
          if (!handleAuthError(error, setError)) {
            if (error.response && error.response.status === 403) {
              setError('You are not authorized to delete this reply');
            } else {
              setError('Failed to delete reply. Please try again.');
            }
          }
        } finally {
          setIsLoading(false);
        }
      };  

    // Handle reply like
  const handleReplyLike = async () => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to like replies');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/replies/${reply?._id}/like`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        setReplyLikes(response.data.liked ? [...replyLikes, loginData.validuserone._id] : 
          replyLikes.filter(id => id !== loginData.validuserone._id));
        setReplyDislikes(replyDislikes.filter(id => id !== loginData.validuserone._id));
        setIsLiked(!isLiked);
        setIsDisLiked(!isDisliked);
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to like reply. Please try again.');
      }
    }
  };

  // Handle reply dislike
  const handleReplyDislike = async (replyId) => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to dislike replies');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/replies/${reply?._id}/dislike`, {}, {
        headers: getAuthHeaders()
      });
        if (response.status === 200) {
          setReplyDislikes(response.data.disliked ? [...replyDislikes, loginData.validuserone._id] : 
            replyDislikes.filter(id => id !== loginData.validuserone._id));
          setReplyLikes(replyLikes.filter(id => id !== loginData?.validuserone._id));
          setIsDisLiked(!isDisliked);
          setIsLiked(!isLiked);
        }
    } catch (error) {
      console.error('Error disliking reply:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to dislike reply. Please try again.');
      }
    }
  };  
    return (
      <>
      <div key={reply?._id} className={`rounded-lg shadow-sm p-3 ${isAuthor ? "bg-blue-50" : "bg-white"}`}>
        {/* user timestapm an d name is author or not */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="font-medium text-blue-600 text-sm">
              {reply?.userName}
            </span>
            <span className="text-gray-400 text-xs ml-2">
              {formatDate(reply?.createdAt)}
            </span>
          </div>
          {isAuthor && (
            <button
              onClick={handleDeleteReply}
              className="text-red-500 hover:text-red-700 ml-2"
              title="Delete"
            >
              <DeleteIcon></DeleteIcon>
            </button>
          )}
        </div>
  
        {/* reply content where details show */}
        <div className="text-gray-700 whitespace-pre-wrap text-sm">
          {reply?.content}
        </div>
  
        {/* Display media attachments */}
        {reply?.mediaAttachments?.length > 0 && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {reply?.mediaAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-md shadow-sm border border-gray-200 bg-gray-50"
                  style={{ maxWidth: "120px", height: "auto" }}
                >
                  <ShowMedia attachment={attachment} />
                </div>
              ))}
            </div>
          )}
  
        {/* lower button section */}
        <div className="flex items-center mt-2 text-xs">
  
          <button onClick={handleReplyLike} className={`flex items-center mr-3 ${ isLiked ? "text-blue-600" : "text-gray-500"} hover:text-blue-600`}>
            <LikeIcon isLiked={isLiked} />
            {replyLikes?.length || 0}
          </button>
  
          <button onClick={handleReplyDislike} className={`flex items-center mr-3 ${ isDisliked ? "text-red-600" : "text-gray-500"} hover:text-red-600`}>
            <DisLikeIcon isDisliked={isDisliked} />
            {replyDislikes?.length || 0}
          </button>
  
          <button
              onClick={() => setShowReplyBox(true)}
            className="flex items-center text-blue-600 hover:text-blue-800">
            <ReplyIcon></ReplyIcon>
            Reply
          </button>
        </div>
  
        {showReplyBox && <ReplyCommentBox replyId={reply?._id}/>}
      </div>
     {showViewMore &&  <div>
        <button onClick={onViewMore}>show view more</button>
      </div>}
      </>
    );
  };
  
  export default ShowReplyContent;
  
  const DeleteIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    );
  };
  
  const LikeIcon = ({ isLiked }) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 mr-1"
        fill={isLiked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
    );
  };
  
  const DisLikeIcon = ({ isDisliked }) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 mr-1"
        fill={isDisliked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5"
        />
      </svg>
    );
  };
  
  const ReplyIcon = () => {
    return (
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
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    );
  };
  