import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { organizeReplies } from "../AiForumPage/components/ForumUtils";
import RecurrsionLoopComment from "./CommentComponent/RecurrsionLoopComment";
import axios from 'axios';
import ReplyCommentBox from "./CommentComponent/ReplyForComment";
import { useWebSocket } from "../AiForumPage/components/WebSocketContext";

const CommentReview = () => {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState(false);
  const [structureReply, setStructureReply] = useState();
  const [threadView,setThreadView] = useState(false);
  const [expandedThreads,setExpandedThreads] = useState({});
  const { id } = useParams();
  const { socket, joinPost, leavePost, subscribeToEvent } = useWebSocket();

  useEffect(() => {
    if(!id){
      console.log(" no id in url");
      return;
    }
    fetchComments(id);
    joinPost(id);

    // Subscribe to WebSocket events
    const unsubscribeCommentCreated = subscribeToEvent('comment_created', (newComment) => {
      setComments(prevComments => {
        const updatedComments = [...(prevComments || []), newComment];
        return updatedComments;
      });
    });

    const unsubscribeCommentDeleted = subscribeToEvent('comment_deleted', (deletedCommentId) => {
      setComments(prevComments => {
        const removeCommentAndChildren = (comments, targetId) => {
          return comments.filter(comment => {
            if (comment._id === targetId) {
              return false; // This removes the comment and all its children
            }
            if (comment.children && comment.children.length > 0) {
              comment.children = removeCommentAndChildren(comment.children, targetId);
            }
            return true;
          });
        };
        return removeCommentAndChildren(prevComments, deletedCommentId);
      });
    });

    const unsubscribeCommentReaction = subscribeToEvent('comment_reaction_updated', (data) => {
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment._id === data.commentId) {
            return {
              ...comment,
              likes: data.likes,
              dislikes: data.dislikes
            };
          }
          return comment;
        });
      });
    });

    return () => {
      leavePost(id);
      unsubscribeCommentCreated();
      unsubscribeCommentDeleted();
      unsubscribeCommentReaction();
    };
  }, [id]);

  useEffect(() => {
    if(comments)
    setStructureReply(organizeReplies(comments || []));
  }, [comments]);

  const fetchComments = async (id) => {
    try {
      setLoading(true);
      console.log("i m going")
      const response = await axios.get(`http://localhost:8099/comments/replies?postId=${id}`);

      if (response.data && response.data.comments) {
        setComments(response.data.comments);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
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

  return (
    <div>
      <div className="relative flex w-full items-center gap-2 mb-2">
        <div className="flex gap-2 text-center justify-center">
          <h1 className="sticky text-xl w-full font-semibold text-text_comment tracking-wide">
            Comments
          </h1>
          <div className="w-4 h-4 mt-2 text-xs font-medium border border-time_header text-time_header bg-bg_scroll rounded">
  {comments?.length}
</div>


        </div>
       
      </div>
      <div className="replyContent w-full pt-2">
        {!threadView &&
          structureReply ?(
          structureReply.map((reply, index) => (
            <>
            <div key={index} className="ml-2">
              <RecurrsionLoopComment
                reply={reply}
              />
            </div>
            </>
          ))):<div>No Comments</div>}
      </div>
    </div>
  );
};

export default CommentReview;


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

