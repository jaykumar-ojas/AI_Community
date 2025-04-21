import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import { useParams } from "react-router-dom";
import { getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import ShowReplyContent from "./ShowReplyContent";
import axios from "axios";
import RecurrsionLoop from "./RecurrsionLoop";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";

const ReplyContent = () => {
  const {topicId} = useParams();  
  const [replies,setReplies] = useState();
  const [structureReply,setStructureReply] = useState();
  const [error,setError]= useState();
  const [isLoading,setIsLoading] = useState(false);
  const [expandedThreads,setExpandedThreads] = useState({});
  const [threadView,setThreadView] = useState();

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



  useEffect(()=>{
    if(topicId){
        fetchReplies(topicId);
    }
  },[topicId]);

    useEffect(()=>{
      if(replies){
          console.log("now i m here");
          setStructureReply(organizeReplies(replies));
      }
    },[replies])

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
        <h1>loaging content</h1>
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
         <div className="relative flex items-center gap-2 p-2 rounded-md  border border-gray-200 mb-2">
          <ReplyBubbleIcon />
          <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Replies</h3>
        </div>
        <div className="replyContent"
            style={{
              maxHeight: '600px', // or any height you want
              overflowY: 'auto',
            }}>
        {!threadView && structureReply && structureReply.map((reply,index)=>(
          <div key={index}  className="ml-2">
             <RecurrsionLoop reply={reply}  expandedThreads={expandedThreads}
            toggleThreadExpansion={toggleThreadExpansion}
            handleViewThread={handleViewThread}/>
          </div>
        ))}</div>
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


