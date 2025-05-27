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
  console.log(reply,hasChildren);

  return (
    <div key={reply?._id} className={`${depth > 0 ? "pl-12 " : ""}`}>
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
