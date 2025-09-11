import React, { useContext, useEffect, useRef, useState } from "react";
import ShowReplyContent from "./ShowReplyContent";
import { LoginContext } from "../../ContextProvider/context";
import UserIconCard from "../../Card/UserIconCard";
import UserNameCard from "../../Card/UserNameCard";

const MAX_DEPTH = 3; // keep your depth limit if you used it earlier

const RecurrsionLoop = ({
  reply,
  depth = 0,
  isLastChild,
  onReplyDeleted,
  scrollToId,               // existing
  setThreadView,            // may be passed from ReplyContent
  setLastThreadContext = () => {}, // <--- default noop to avoid "not a function"
}) => {
  const { loginData } = useContext(LoginContext);
  const [showReply, setShowReply] = useState(false);
  const hasChildren = reply?.children && reply?.children.length > 0;
  const [view, setView] = useState(true);
  const commentRef = useRef(null);

useEffect(() => {
  if (scrollToId && reply?._id === scrollToId && commentRef.current) {
    commentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

    // Highlight the comment with a light warm white
    commentRef.current.classList.add("bg-amber-50", "rounded");
    setTimeout(() => {
      commentRef.current?.classList.remove("bg-amber-50", "rounded");
    }, 2000);
  }
}, [scrollToId, reply?._id]);


  return (
    // add an id so ReplyContent can scroll back to this exact element
    <div
      id={`reply-${reply?._id}`}
      key={reply?._id}
      ref={commentRef}
      className={`relative ${depth > 0 ? "ml-8" : ``}`}
    >
      <div
        className="absolute top-0 left-0 h-full border-l border-time_header"
        style={{ marginLeft: "0.75rem" }}
      />
      {!hasChildren && (
        <div
          className="absolute top-0 left-0 h-full border-l border-gray-100 dark:border-bg_comment_box"
          style={{ marginLeft: "0.75rem" }}
        />
      )}
      {!view && (
        <div
          className="absolute top-0 left-0 h-full border-l bg-gray-100 dark:border-bg_comment_box"
          style={{ marginLeft: "0.75rem" }}
        />
      )}

      {hasChildren && (
        <div
          className={`absolute ${
            view ? "top-12 left-0" : "top-6 left-4"
          } left-0 h-full z-0`}
          style={{ marginLeft: "0rem" }}
        >
          {view && (
            <button
              onClick={() => setView(!view)}
              className="w-6 h-6 rounded-full z-10 text-black dark:text-text_header bg-blue-200 dark:bg-btn_bg cursor-pointer"
            >
              -
            </button>
          )}
        </div>
      )}

      {depth > 0 && (
        <div
          className="absolute w-1 h-3 border-l z-20 border-b border-time_header/30 rounded-bl-3xl"
          style={{
            left: "-1.25rem",
            width: "2rem",
            height: "1rem",
          }}
        />
      )}

      {isLastChild && (
        <div
          className="absolute left-0 w-1  h-full bg-gray-100 dark:bg-bg_comment_box z-10"
          style={{
            marginLeft: "-1.25rem",
          }}
        />
      )}

      {!view && (
        <div className="text-white flex items-center gap-2 z-40 pb-4">
          <button
            onClick={() => setView(!view)}
            className="w-6 h-6 z-0 flex items-center justify-center rounded-full text-text_header bg-btn_bg cursor-pointer"
          >
            +
          </button>
          <div className="w-8 h-8 flex-shrink-0">
            <UserIconCard id={reply?.userId} />
          </div>
          <UserNameCard id={reply?.userId} />
        </div>
      )}

      {reply && (
        <ShowReplyContent
          reply={reply}
          hasChildren={hasChildren}
          onReplyDeleted={onReplyDeleted}
        />
      )}

      {hasChildren && view && (
        <div className="">
          {depth + 1 < MAX_DEPTH ? (
            reply?.children.map((childReply, index) => (
              <RecurrsionLoop
                key={childReply?._id}
                reply={childReply}
                depth={depth + 1}
                isLastChild={index === reply.children.length - 1}
                onReplyDeleted={onReplyDeleted}
                scrollToId={scrollToId}
                setThreadView={setThreadView}
                setLastThreadContext={setLastThreadContext} // pass down so child can set it too
              />
            ))
          ) : (
            <div
              className="pl-8 py-2 text-blue-600 text-sm cursor-pointer hover:underline"
              onClick={() => {
                // remember where we came from, then open thread view
                setLastThreadContext(reply._id);
                if (typeof setThreadView === "function") {
                  setThreadView(reply._id);
                }
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

export default RecurrsionLoop;
