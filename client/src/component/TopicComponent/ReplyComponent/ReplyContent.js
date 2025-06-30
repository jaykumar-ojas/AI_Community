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

  // WebSocket Handlers
  useEffect(() => {
    const unsubscribeNew = subscribeToEvent("reply_created", (newReply) => {
  if (newReply.topicId !== topicId) return;

  queryClient.setQueryData(["replies", topicId], (oldReplies = []) => {
    // Check if the reply already exists
    const exists = (replies, id) => {
      for (const reply of replies) {
        if (reply._id === id) return true;
        if (reply.children && exists(reply.children, id)) return true;
      }
      return false;
    };

    if (exists(oldReplies, newReply._id)) return oldReplies;
    console.log("i m adding reply")
    // Recursive helper to insert into the right parent's children
    const insertIntoParent = (replies) => {
  let modified = false;

  const updated = replies.map(reply => {
    if (reply._id === newReply.parentReplyId) {
      modified = true;
      return {
        ...reply,
        children: [...(reply.children || []), { ...newReply, children: [] }],
      };
    }

    if (reply.children?.length) {
      const newChildren = insertIntoParent(reply.children);
      if (newChildren !== reply.children) {
        modified = true;
        return { ...reply, children: newChildren };
      }
    }

    return reply;
  });

  return modified ? updated : replies;
};



    // If it's a top-level reply, push to the root
    if (!newReply.parentReplyId) {
      return [...oldReplies, { ...newReply, children: [] }];
    }

    // Otherwise, insert as a nested reply
    const updatedReplies = insertIntoParent(oldReplies);
    return updatedReplies;
  });
});


    const unsubscribeDelete = subscribeToEvent("reply_deleted", (deletedReplyId) => {
      queryClient.setQueryData(["replies", topicId], (oldReplies = []) => {
        const removeReply = (replies) => {
          return replies.filter(reply => {
            if (reply._id === deletedReplyId) return false;
            if (reply.children) {
              reply.children = removeReply(reply.children);
            }
            return true;
          });
        };
        return organizeReplies(removeReply(oldReplies));
      });
    });

    return () => {
      unsubscribeNew();
      unsubscribeDelete();
    };
  }, [topicId]);

  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const findReplyById = (replies, replyId) => {
    for (const reply of replies) {
      if (reply._id === replyId) return reply;
      if (reply.children?.length) {
        const found = findReplyById(reply.children, replyId);
        if (found) return found;
      }
    }
    return null;
  };

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
        {replies?.length > 0 ? (
          replies.map((reply, index) => (
            <div key={reply._id || index} className="ml-2">
              <RecurrsionLoop
                reply={reply}
                expandedThreads={expandedThreads}
                setExpandedThreads={setExpandedThreads}
                threadView={threadView}
                setThreadView={setThreadView}
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
