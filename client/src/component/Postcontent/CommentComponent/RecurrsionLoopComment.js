import React, { useEffect, useRef, useState } from "react";
import ShowCommentContent from "./ShowCommentContent";
import UserIconCard from "../../Card/UserIconCard";
import UserNameCard from "../../Card/UserNameCard";
import { useParams } from "react-router-dom";

const MAX_DEPTH = 3;
const getLineColor = (depth) => {
  const colors = [
    "border-red-400",
    "border-green-400",
    "border-blue-400",
    "border-yellow-400",
    "border-purple-400",
    "border-pink-400",
  ];
  return colors[depth % colors.length]; // cycle through colors
};

const RecurrsionLoopComment = ({
  reply,
  depth = 0,
  isLastChild,
  setThreadView = () => {},
  setLastThreadContext = () => {},
}) => {
  const [view, setView] = useState(true);
  const hasChildren = reply?.children && reply?.children.length > 0;
  const params = useParams();
  const scrollToId = params['comment'];
  const commentRef = useRef(null);

  useEffect(() => {
    if (scrollToId && reply?._id === scrollToId && commentRef.current) {
      // delay to avoid race condition with rendering
      const timer = setTimeout(() => {
        commentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  
        // adjust upwards a bit so it's slightly hidden
        setTimeout(() => {
          window.scrollBy({ top: -40, behavior: "smooth" });
        }, 300);
  
        // highlight effect
        commentRef.current.classList.add("bg-amber-50", "rounded");
        setTimeout(() => {
          commentRef.current?.classList.remove("bg-amber-50", "rounded");
        }, 2000);
      }, 1000); // <-- delay before running scroll logic
  
      return () => clearTimeout(timer);
    }
  }, [scrollToId, reply?._id]);

  return (
    <div key={reply?._id} ref={commentRef} className={`relative ${depth > 0 ? "ml-8" : ""}`}>
      {/* Colored vertical line */}
      <div
        className={`absolute top-0 left-0 h-full border-l ${getLineColor(depth)}`}
        style={{ marginLeft: "0.75rem" }}
      />

      {/* fallback for comments with no children */}
      {!hasChildren && (
        <div
          className="absolute top-0 left-0 h-full border-l border-gray-100 dark:border-bg_comment_box"
          style={{ marginLeft: "0.75rem" }}
        />
      )}
      {!view && (
        <div
          className="absolute top-0 left-0 h-full border-l border-gray-100 dark:border-bg_comment_box"
          style={{ marginLeft: "0.75rem" }}
        />
      )}

      {hasChildren && (
        <div
          className={`absolute ${view ? "top-12 left-0" : "top-6 left-4"} left-0 h-full z-30`}
          style={{ marginLeft: "0rem" }}
        >
          {view && (
            <button
              onClick={() => setView(!view)}
              className="w-6 h-6 rounded-full text-black dark:text-text_header bg-blue-200 dark:bg-btn_bg cursor-pointer"
            >
              -
            </button>
          )}
        </div>
      )}

      {depth > 0 && (
        <div
          className={`absolute w-1 h-3 border-l z-20 border-b rounded-bl-3xl ${getLineColor(
            depth - 1
          )}`}
          style={{
            left: "-1.25rem",
            width: "2rem",
            height: "1rem",
          }}
        />
      )}

      {isLastChild && (
        <div
          className="absolute left-0 w-1 h-full bg-gray-100 dark:bg-bg_comment_box z-10"
          style={{ marginLeft: "-1.25rem" }}
        />
      )}

      {reply && view && <ShowCommentContent reply={reply} />}

      {!view && (
        <div className="dark:text-white text-black flex items-center gap-2 z-40 pb-4">
          <button
            onClick={() => setView(!view)}
            className="w-6 h-6 z-40 flex items-center justify-center rounded-full text-black dark:text-text_header bg-blue-200 dark:bg-btn_bg cursor-pointer"
          >
            +
          </button>
          <div className="w-8 h-8 flex-shrink-0">
            <UserIconCard id={reply?.userId} />
          </div>
          <UserNameCard id={reply?.userId} />
        </div>
      )}

      {hasChildren && view && (
        <div>
          {depth + 1 < MAX_DEPTH ? (
            reply?.children.map((childReply, index) => (
              <RecurrsionLoopComment
                key={childReply?._id}
                reply={childReply}
                depth={depth + 1}
                isLastChild={index === reply.children.length - 1}
                scrollToId={scrollToId}
                setThreadView={setThreadView}
                setLastThreadContext={setLastThreadContext}
              />
            ))
          ) : (
            <div
              className="pl-8 text-blue-600 text-sm cursor-pointer hover:underline"
              onClick={() => {
                setLastThreadContext(reply._id);
                setThreadView(reply._id);
              }}
            >
              Continue thread →
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurrsionLoopComment;
