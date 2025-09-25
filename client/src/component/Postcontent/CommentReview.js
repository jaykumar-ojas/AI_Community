import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { organizeReplies } from "../AiForumPage/components/ForumUtils";
import RecurrsionLoopComment from "./CommentComponent/RecurrsionLoopComment";
import axios from "axios";
import { useWebSocket } from "../AiForumPage/components/WebSocketContext";
import ReplySkeletonLayout from "../TopicComponent/ReplyComponent/ReplySkeletonLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
const baseUrl = process.env.REACT_APP_BASE_URL;


const fetchComments = async (postId) => {
  const response = await axios.get(`${baseUrl}/comments/replies?postId=${postId}`);
  if (response.data?.comments) {
    return response.data.comments;
  }
  throw new Error("Failed to fetch comments");
};

const CommentReview = () => {
  const { id } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const scrollToId = params.get("comment");

  const queryClient = useQueryClient();
  const { joinPost, leavePost, subscribeToEvent } = useWebSocket();

  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

  const [structureReply, setStructureReply] = useState();
  const [threadView, setThreadView] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [lastThreadContext, setLastThreadContext] = useState(null);

  useEffect(() => {
    if (comments) {
      setStructureReply(organizeReplies(comments));
    }
  }, [comments]);

  useEffect(() => {
    if (!id) return;

    joinPost(id);

    const unsubscribeCommentCreated = subscribeToEvent("comment_created", (newComment) => {
      queryClient.setQueryData(["comments", id], (old = []) => [...old, newComment]);
    });

    const unsubscribeCommentDeleted = subscribeToEvent("comment_deleted", (deletedCommentId) => {
      const markDeleted = (comments, targetId) => {
        return comments.map((comment) => {
          if (comment._id === targetId) {
            return {
              ...comment,
              userId: null,
              userName: 'deleted'
            };
          }
          if (comment.children && comment.children.length > 0) {
            return {
              ...comment,
              children: markDeleted(comment.children, targetId)
            };
          }
          return comment;
        });
      };
      queryClient.setQueryData(["comments", id], (old = []) =>
        markDeleted(old, deletedCommentId)
      );
    });

    const unsubscribeCommentReaction = subscribeToEvent("comment_reaction_updated", (data) => {
      queryClient.setQueryData(["comments", id], (old = []) =>
        old.map((comment) =>
          comment._id === data.commentId
            ? { ...comment, likes: data.likes, dislikes: data.dislikes }
            : comment
        )
      );
    });

    return () => {
      leavePost(id);
      unsubscribeCommentCreated();
      unsubscribeCommentDeleted();
      unsubscribeCommentReaction();
    };
  }, [id, queryClient, joinPost, leavePost, subscribeToEvent]);

  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const findCommentById = (list, targetId) => {
    for (const item of list || []) {
      if (item._id === targetId) return item;
      if (item.children?.length) {
        const found = findCommentById(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // When we come BACK from a thread view, scroll to the lastThreadContext element
  useEffect(() => {
    if (threadView === null && lastThreadContext && structureReply?.length) {
      setTimeout(() => {
        const el = document.getElementById(`reply-${lastThreadContext}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("bg-amber-50", "rounded");
          setTimeout(() => el.classList.remove("bg-amber-50", "rounded"), 2000);
          setLastThreadContext(null);
        }
      }, 50);
    }
  }, [threadView, lastThreadContext, structureReply]);

  if (isLoading) {
    return <ReplySkeletonLayout />;
  }


  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load comments.
        <button
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (threadView) {
    const thread = findCommentById(structureReply, threadView);
    return (
      <div className="thread-view">
        <button
          className="text-blue-600 hover:underline mb-2 text-sm"
          onClick={() => setThreadView(null)}
        >
          ← Back to comments
        </button>
        {thread ? (
          <div className="md:ml-2">
            <RecurrsionLoopComment
              reply={thread}
              expandedThreads={expandedThreads}
              setExpandedThreads={setExpandedThreads}
              threadView={threadView}
              setThreadView={setThreadView}
              setLastThreadContext={setLastThreadContext}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">Thread not found</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="relative flex w-full items-center gap-2 mb-2">
        <div className="flex gap-2 text-center justify-center">
          <h1 className="sticky text-md md:text-xl w-full font-semibold text-gray-900 dark:text-text_comment tracking-wide">
            Comments
          </h1>
          <div className="w-4 h-4 mt-1 md:mt-2 text-[10px] md:text-xs font-medium border border-gray-600 dark:border-time_header text-gray-800 dark:text-time_header dark:bg-bg_scroll rounded">
            {structureReply?.length || 0}
          </div>
        </div>
      </div>

      <div className="replyContent w-full pt-2">
        {structureReply?.length > 0 ? (
          structureReply.map((reply, index) => (
            <div key={reply._id || index} className="ml-2">
              <RecurrsionLoopComment
                reply={reply}
                scrollToId={scrollToId}
                setThreadView={setThreadView}
                setLastThreadContext={setLastThreadContext}
              />
            </div>
          ))
        ) : (
          <div>No Comments</div>
        )}
      </div>
    </div>
  );
};

export default CommentReview;
