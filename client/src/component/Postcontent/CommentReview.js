import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { organizeReplies } from "../AiForumPage/components/ForumUtils";
import RecurrsionLoopComment from "./CommentComponent/RecurrsionLoopComment";
import axios from "axios";
import { useWebSocket } from "../AiForumPage/components/WebSocketContext";
import ReplySkeletonLayout from "../TopicComponent/ReplyComponent/ReplySkeletonLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const fetchComments = async (postId) => {
  const response = await axios.get(`http://localhost:8099/comments/replies?postId=${postId}`);
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
      const removeCommentAndChildren = (comments, targetId) => {
        return comments.filter((comment) => {
          if (comment._id === targetId) return false;
          if (comment.children && comment.children.length > 0) {
            comment.children = removeCommentAndChildren(comment.children, targetId);
          }
          return true;
        });
      };
      queryClient.setQueryData(["comments", id], (old = []) =>
        removeCommentAndChildren(old, deletedCommentId)
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
  }, [id, queryClient]);

  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const handleViewThread = (replyId) => {
    setThreadView(replyId);
  };

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

  return (
    <div>
      <div className="relative flex w-full items-center gap-2 mb-2">
        <div className="flex gap-2 text-center justify-center">
          <h1 className="sticky text-xl w-full font-semibold text-text_comment tracking-wide">
            Comments
          </h1>
          <div className="w-4 h-4 mt-2 text-xs font-medium border border-time_header text-time_header bg-bg_scroll rounded">
            {comments?.length || 0}
          </div>
        </div>
      </div>

      <div className="replyContent w-full pt-2">
        {!threadView && structureReply?.length > 0 ? (
          structureReply.map((reply, index) => (
            <div key={reply._id || index} className="ml-2">
              <RecurrsionLoopComment reply={reply} scrollToId={scrollToId} />
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
