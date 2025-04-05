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
}) => {
  const { loginData } = useContext(LoginContext);
  const MAX_VISIBLE_DEPTH = 3;
  const isAuthor = loginData?.validuserone?._id === reply?.userId;
  const hasChildren = reply?.children && reply?.children.length > 0;
  const [threadView, setThreadView] = useState();

  const isExpanded = expandedThreads[reply?._id];
  const isDeep = depth >= MAX_VISIBLE_DEPTH;
  const showViewMore = hasChildren && isDeep && !isExpanded;

  return (
    <React.Fragment key={reply?._id}>
      {reply && (
        <ShowReplyContent
          reply={reply}
          showViewMore={showViewMore}
          onViewMore={() =>
            isDeep
              ? handleViewThread(reply?._id)
              : toggleThreadExpansion(reply?._id)
          }
        />
      )}
      {/* Show reply form if replying to this message */}

      {/* Render children if expanded or not too deep */}
      {hasChildren && (!isDeep || isExpanded) && (
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
              />
            </div>
          ))}
        </div>
      )}
    </React.Fragment>
  );
};

export default RecurrsionLoop;
