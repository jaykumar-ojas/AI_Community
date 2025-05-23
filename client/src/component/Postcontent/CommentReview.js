import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { organizeReplies } from "../AiForumPage/components/ForumUtils";
import RecurrsionLoopComment from "./CommentComponent/RecurrsionLoopComment";
import axios from 'axios';
import ReplyCommentBox from "./CommentComponent/ReplyForComment";

const CommentReview = () => {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState(false);
  const [structureReply, setStructureReply] = useState();
  const [threadView,setThreadView] = useState(false);
  const [expandedThreads,setExpandedThreads] = useState({});
  const { id } = useParams();
  console.log(id);

  useEffect(() => {
    if(!id){
      console.log(" no id in url");
    }
    fetchComments(id);
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
      <div className="relative flex w-full items-center gap-2 p-2 mb-2">
        <h1 className="sticky fixed text-2xl w-full font-semibold text-text_comment tracking-wide">
          Comments
        </h1>
      </div>
      <div className="replyContent w-full pt-2">
        {!threadView &&
          structureReply ?(
          structureReply.map((reply, index) => (
            <>
            <div key={index} className="ml-2">
              <RecurrsionLoopComment
                reply={reply}
                expandedThreads={expandedThreads}
                toggleThreadExpansion={toggleThreadExpansion}
                handleViewThread={handleViewThread}
              />
            </div>
            </>
          ))):<div>No Comments</div>}
      </div>
    </div>
  );
};

export default CommentReview;


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

