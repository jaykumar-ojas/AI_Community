import React, { useContext, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import ShowCommentContent from "./ShowCommentContent";

const RecurrsionLoopComment = ({
  reply,
  depth = 0,
  expandedThreads,
  toggleThreadExpansion,
  handleViewThread,
}) => {
  const MAX_VISIBLE_DEPTH = 3;
  const hasChildren = reply?.children && reply?.children.length > 0;
  const isExpanded = expandedThreads[reply?._id];
  const isDeep = depth >= MAX_VISIBLE_DEPTH; 
  const showViewMore = hasChildren && isDeep && !isExpanded;
  const [showReply,setShowReply] = useState(false);
  const show = (depth===2);

  const threadColor = [
    "bg-red-300",
    "bg-blue-300",
    "bg-green-300",
    "bg-yellow-300",
    "bg-purple-300",
  ][depth % 5];

  const borderColor = [
    "border-red-300",
    "border-blue-300",
    "border-green-300",
    "border-yellow-300",
    "border-purple-300",
  ][depth % 5];

  return (
    <div key={reply?._id} className={`relative my-2 ${depth > 0 ? `pl-4 border-l-2 ${borderColor}` : ""}`}>
       {/* Thread connector dot */}
       {depth > 0 && (
        <>
          <div className={`absolute left-[-1px] top-16 w-4 h-0.5 ${threadColor}`}></div>

          <div className="absolute top-16 bg-white"></div>
          </>
      )}
      {reply && (
        <ShowCommentContent
          reply={reply}
          showViewMore={showViewMore}
          onViewMore={() =>
            isDeep
              ? handleViewThread(reply?._id)
              : toggleThreadExpansion(reply?._id)
          }
          hasChildren={hasChildren}
        show={show}
        showReply={showReply}
        setShowReply={setShowReply}
        />
      )}
      {/* Show reply form if replying to this message */}

      {/* Render children if expanded or not too deep */}
      {hasChildren && (!show || showReply)&& (!isDeep || isExpanded) && (
        <div className="">
          {reply?.children.map((childReply) => (
            <div key={childReply?._id}>
              <RecurrsionLoopComment
                reply={childReply}
                depth={depth + 1}
                expandedThreads={expandedThreads}
                toggleThreadExpansion={toggleThreadExpansion}
                handleViewThread={handleViewThread}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurrsionLoopComment;
