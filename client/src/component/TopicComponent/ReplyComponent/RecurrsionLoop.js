import React, { useContext, useState } from "react";
import ShowReplyContent from "./ShowReplyContent";
import { LoginContext } from "../../ContextProvider/context";

const RecurrsionLoop = ({
  reply,
  depth = 0,
  parentReply = null,
  expandedThreads,
  toggleThreadExpansion,
  handleViewThread,
  onReplyDeleted // Add this new prop
}) => {
  const { loginData } = useContext(LoginContext);
  const MAX_VISIBLE_DEPTH = 3;
  const isAuthor = loginData?.validuserone?._id === reply?.userId;
  const hasChildren = reply?.children && reply?.children.length > 0;

  const [threadView, setThreadView] = useState();
  const isExpanded = expandedThreads[reply?._id];
  const isDeep = depth >= MAX_VISIBLE_DEPTH;

  const showViewMore = hasChildren && isDeep && !isExpanded;
  const [showReply, setShowReply] = useState(false);
  const show = (depth === 2);

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
        <ShowReplyContent
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
          onReplyDeleted={onReplyDeleted} // Pass down the delete handler
        />
      )}

      {/* Render children if expanded or not too deep */}
      {hasChildren && (!show || showReply) && (!isDeep || isExpanded) && (
        <div className="ml-4">
          {reply?.children.map((childReply) => (
            <div key={childReply._id}>
              <RecurrsionLoop
                reply={childReply}
                depth={depth + 1}
                parentReply={reply}
                expandedThreads={expandedThreads}
                toggleThreadExpansion={toggleThreadExpansion}
                handleViewThread={handleViewThread}
                onReplyDeleted={onReplyDeleted} // Pass down the delete handler
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurrsionLoop;
