import React, { useContext, useEffect, useState, useRef } from "react";
import { LoginContext } from "../../ContextProvider/context";
import { useParams } from "react-router-dom";
import { getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import ShowReplyContent from "./ShowReplyContent";
import axios from "axios";
import RecurrsionLoop from "./RecurrsionLoop";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import "./ReplyContent.css";

const ReplyContent = () => {
  const {topicId} = useParams();  
  const [replies,setReplies] = useState();
  const [structureReply,setStructureReply] = useState();
  const [error,setError]= useState();
  const [isLoading,setIsLoading] = useState(false);
  const [expandedThreads,setExpandedThreads] = useState({});
  const [threadView,setThreadView] = useState();

  const [forceRender, setForceRender] = useState(0); // Add force render trigger
  const repliesContainerRef = useRef(null);
  const { subscribeToEvent, joinTopic, leaveTopic } = useWebSocket();

  // Join topic room when component mounts
  useEffect(() => {
    if (topicId) {
      joinTopic(topicId);
      return () => leaveTopic(topicId);
    }
  }, [topicId, joinTopic, leaveTopic]);

  const findReplyById = (replies, replyId) => {
    for (const reply of replies) {
      if (reply._id === replyId) {
        return reply;
      }
      if (reply.children && reply.children.length > 0) {
        const found = findReplyById(reply.children, replyId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update nested replies
  const updateRepliesWithNewReply = (replies, newReply) => {
    if (!replies) return [newReply];
    
    const updatedReplies = [...replies];
    
    if (newReply.parentReplyId) {
      // Find and update parent reply recursively
      const updateParentReply = (repliesArray) => {
        for (let i = 0; i < repliesArray.length; i++) {
          if (repliesArray[i]._id === newReply.parentReplyId) {
            if (!repliesArray[i].children) {
              repliesArray[i].children = [];
            }
            repliesArray[i].children.push(newReply);
            return true;
          }
          if (repliesArray[i].children && repliesArray[i].children.length > 0) {
            if (updateParentReply(repliesArray[i].children)) return true;
          }
        }
        return false;
      };
      
      const updated = updateParentReply(updatedReplies);
      if (!updated) {
        console.warn('Parent reply not found for nested reply:', newReply.parentReplyId);
        // Fallback: add as root level reply if parent not found
        updatedReplies.push(newReply);
      }
    } else {
      // Root level reply
      updatedReplies.push(newReply);
    }
    
    return updatedReplies;
  };

  useEffect(() => {
    const unsubscribe = subscribeToEvent('reply_created', (newReply) => {
      console.log("this data coming from backend",newReply);
      if (newReply.topicId === topicId) {
        setReplies((prevReplies) => {
          const updatedReplies = [...prevReplies, newReply];
          setStructureReply(organizeReplies(updatedReplies));
          console.log(structureReply,"this is printed my sturcture replies");
          return updatedReplies;
        });
      }
    });

    // Subscribe to reply deletion events
    const unsubscribeDelete = subscribeToEvent('reply_deleted', (deletedReplyId) => {
      console.log('Reply deleted:', deletedReplyId);
      setReplies((prevReplies) => {
        // Helper function to remove reply and its children recursively
        const removeReplyAndChildren = (replies) => {
          return replies.filter(reply => {
            // If this is the reply to be deleted, remove it and all its children
            if (reply._id === deletedReplyId) {
              return false;
            }
            
            // If this reply has children, recursively process them
            if (reply.children && reply.children.length > 0) {
              // First, check if any of the children are the one being deleted
              const hasDeletedChild = reply.children.some(child => child._id === deletedReplyId);
              if (hasDeletedChild) {
                // Remove the deleted child from children array
                reply.children = reply.children.filter(child => child._id !== deletedReplyId);
              } else {
                // Recursively process children
                reply.children = removeReplyAndChildren(reply.children);
              }
            }
            return true;
          });
        };

        const updatedReplies = removeReplyAndChildren(prevReplies);
        
        // Update structured replies
        setStructureReply(organizeReplies(updatedReplies));
        
        return updatedReplies;
      });
    });

    return () => {
      unsubscribe();
      unsubscribeDelete();
    };
  }, [topicId, subscribeToEvent]);

  // Scroll to new reply with retry mechanism
 




  useEffect(()=>{
    if(topicId){
        fetchReplies(topicId);
    }
  },[topicId]);

  // Update structured replies when replies change from API call (initial load)
  useEffect(()=>{
    if(replies){
        setStructureReply(organizeReplies(replies));
        console.log("i am comming to structure the data", replies?.length);
    }
  },[replies]);

  const fetchReplies = async (topicId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${REPLIES_URL}?topicId=${topicId}`, { headers: getAuthHeaders() });
      setReplies(response.data.replies || []);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching replies:', err);
      setError('Failed to load replies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyDeleted = (deletedReplyId) => {
    console.log('Handling reply deletion:', deletedReplyId);
    
    setReplies((prevReplies) => {
      // Helper function to remove reply and its children recursively
      const removeReplyAndChildren = (replies) => {
        return replies.filter(reply => {
          // If this is the reply to be deleted, remove it and all its children
          if (reply._id === deletedReplyId) {
            return false;
          }
          
          // If this reply has children, recursively process them
          if (reply.children && reply.children.length > 0) {
            // First, check if any of the children are the one being deleted
            const hasDeletedChild = reply.children.some(child => child._id === deletedReplyId);
            if (hasDeletedChild) {
              // Remove the deleted child from children array
              reply.children = reply.children.filter(child => child._id !== deletedReplyId);
            } else {
              // Recursively process children
              reply.children = removeReplyAndChildren(reply.children);
            }
          }
          return true;
        });
      };

      const updatedReplies = removeReplyAndChildren(prevReplies);
      
      // Update structured replies
      setStructureReply(organizeReplies(updatedReplies));
      
      return updatedReplies;
    });
  };
  

  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const handleViewThread = (replyId) => {
    setThreadView(replyId);
  };

  if(isLoading){
    return (
      <h1>Loading content...</h1>
    );
  }

  if (threadView) {
    const thread = findReplyById(structureReply, threadView);
    return (
      <div className="thread-view">
        <button
          className="text-blue-600 hover:underline mb-2 text-sm"
          onClick={() => setThreadView(null)}
        >
          ← Back to main discussion
        </button>
        {thread && (
          <RecurrsionLoop
            reply={thread}
            expandedThreads={expandedThreads}
            toggleThreadExpansion={toggleThreadExpansion}
            handleViewThread={setThreadView}
          />
        )}
      </div>
    );
  }

  return (
  <div>
    <div className="relative flex items-center p-2 mb-2">
      <h1 className="sticky fixed text-xl w-full font-semibold text-text_comment tracking-wide">
        Replies
      </h1>
    </div>

    <div className="replyContent">
      {!threadView && structureReply && structureReply.length > 0 ? (
        structureReply.map((reply, index) => (
          <div key={index} className="ml-2">
            <RecurrsionLoop
              reply={reply}
              expandedThreads={expandedThreads}
              setExpandedThreads={setExpandedThreads}
              threadView={threadView}
              setThreadView={setThreadView}
              onReplyDeleted={handleReplyDeleted} // Add this line
            />
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">No replies yet</div>
      )}
    </div>
  </div>
);

};

export default ReplyContent;

const ReplyBubbleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-blue-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M7 8h10M7 12h4m-2 8c-4.418 0-8-2.686-8-6V6c0-1.104.896-2 2-2h16c1.104 0 2 .896 2 2v8c0 3.314-3.582 6-8 6h-2l-4 4v-4z"
    />
  </svg>
);

const findReplyById = (replies, replyId) => {
  for (const reply of replies) {
    if (reply._id === replyId) {
      return reply;
    }
    if (reply.children && reply.children.length > 0) {
      const found = findReplyById(reply.children, replyId);
      if (found) return found;
    }
  }
  return null;
};