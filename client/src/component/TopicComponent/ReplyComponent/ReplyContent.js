import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import { useParams } from "react-router-dom";
import { getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import ShowReplyContent from "./ShowReplyContent";
import axios from "axios";
import RecurrsionLoop from "./RecurrsionLoop";

const ReplyContent = () => {
  const {topicId} = useParams();  
  const {loginData} = useContext(LoginContext);
  const [replies,setReplies] = useState();
  const [structureReply,setStructureReply] = useState();
  const [error,setError]= useState();
  const [isLoading,setIsLoading] = useState(false);
  const MAX_VISIBLE_DEPTH = 3;
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
    <React.Fragment>
        {!threadView && structureReply && structureReply.map((reply,index)=>(
          <div key={index}>
             <RecurrsionLoop reply={reply}  expandedThreads={expandedThreads}
            toggleThreadExpansion={toggleThreadExpansion}
            handleViewThread={handleViewThread}/>
          </div>
        ))}
      {/* Show reply form if replying to this message */}

      {/* Render children if expanded or not too deep */}
      
    </React.Fragment> 
  );
};

export default ReplyContent;

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


