import React, { useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoginContext } from "../../ContextProvider/context";
import {
  getAuthHeaders,
  handleAuthError,
  organizeReplies,
  REPLIES_URL,
} from "../../AiForumPage/components/ForumUtils";
import axios from "axios";
import RecurrsionLoop from "./RecurrsionLoop";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import ReplySkeletonLayout from "./ReplySkeletonLayout";

const fetchReplies = async (topicId) => {
  const response = await axios.get(`${REPLIES_URL}?topicId=${topicId}`, {
    headers: getAuthHeaders(),
  });
  return response.data.replies || [];
};

const ReplyContent = () => {
  const { topicId } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const scrollToId = params.get("comment");

  const [expandedThreads, setExpandedThreads] = useState({});
  const [threadView, setThreadView] = useState();
  const [lastThreadContext, setLastThreadContext] = useState(null); // <-- new
  const queryClient = useQueryClient();

  const { subscribeToEvent, joinTopic, leaveTopic } = useWebSocket();

  useEffect(() => {
    if (topicId) {
      joinTopic(topicId);
      return () => leaveTopic(topicId);
    }
  }, [topicId, joinTopic, leaveTopic]);

  const {
    data: replies,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["replies", topicId],
    queryFn: () => fetchReplies(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    retry: false,
    select: (data) => organizeReplies(data),
    onError: (err) => {
      if (handleAuthError(err)) return;
      console.error("Error fetching replies:", err);
    },
  });

  // WebSocket handlers (unchanged)
  useEffect(() => {
    const unsubscribeNew = subscribeToEvent("reply_created", (newReply) => {
      if (newReply.topicId !== topicId) return;
      queryClient.invalidateQueries(["replies", topicId]);
    });

    const unsubscribeDelete = subscribeToEvent("reply_deleted", (deletedReplyId) => {
      queryClient.setQueryData(["replies", topicId], (oldReplies = []) => {
        const removeReplyAndChildren = (replies) => {
          return replies.filter(reply => {
            if (reply._id === deletedReplyId) {
              return false;
            }
            if (reply.children && reply.children.length > 0) {
              reply.children = removeReplyAndChildren(reply.children);
            }
            return true;
          });
        };
        const updatedReplies = removeReplyAndChildren(oldReplies);
        return organizeReplies(updatedReplies);
      });
      queryClient.invalidateQueries(["replies", topicId]);
    });

    return () => {
      unsubscribeNew();
      unsubscribeDelete();
    };
  }, [topicId, queryClient, subscribeToEvent]);

  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const findReplyById = (repliesList, replyId) => {
    for (const reply of repliesList) {
      if (reply._id === replyId) return reply;
      if (reply.children?.length) {
        const found = findReplyById(reply.children, replyId);
        if (found) return found;
      }
    }
    return null;
  };

  // When we come BACK from a thread view, scroll to the lastThreadContext element
  useEffect(() => {
    if (threadView === null && lastThreadContext && replies?.length) {
      // short delay to let DOM render
      setTimeout(() => {
        const el = document.getElementById(`reply-${lastThreadContext}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-yellow-400", "rounded");
          setTimeout(() => el.classList.remove("ring-2", "ring-yellow-400", "rounded"), 2000);
          // clear the context unless you want to keep it for subsequent back
          setLastThreadContext(null);
        }
      }, 50);
    }
    // dependencies: threadView, lastThreadContext, replies
  }, [threadView, lastThreadContext, replies]);

  if (isLoading) return <ReplySkeletonLayout />;

  if (isError) {
    return <div className="text-center text-red-500">Failed to load replies.</div>;
  }

  if (threadView) {
    const thread = findReplyById(replies, threadView);
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
            setThreadView={setThreadView}
            setLastThreadContext={setLastThreadContext} // pass here as well
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="relative flex items-center md:p-2 mb-2">
        <h1 className="my-1 md: my-0 text-md md:text-xl w-full font-semibold text-gray-900 dark:text-text_comment tracking-wide">
          Replies
        </h1>
      </div>
      <div className="replyContent">
        {replies?.length > 0 ? (
          replies.map((reply, index) => (
            <div key={reply._id || index} className="md:ml-2">
              <RecurrsionLoop
                reply={reply}
                expandedThreads={expandedThreads}
                setExpandedThreads={setExpandedThreads}
                threadView={threadView}
                setThreadView={setThreadView}
                setLastThreadContext={setLastThreadContext} // <-- pass it here
                scrollToId={scrollToId}
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
