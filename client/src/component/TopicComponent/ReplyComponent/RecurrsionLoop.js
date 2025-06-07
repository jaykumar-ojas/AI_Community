import React, { useContext, useState } from "react";
import ShowReplyContent from "./ShowReplyContent";
import { LoginContext } from "../../ContextProvider/context";
import UserIconCard from "../../Card/UserIconCard";
import UserNameCard from "../../Card/UserNameCard";

const RecurrsionLoop = ({
  reply,
  depth = 0,
  isLastChild,
  onReplyDeleted // Add this new prop
}) => {
  const { loginData } = useContext(LoginContext);
  const [showReply, setShowReply] = useState(false);
  const hasChildren = reply?.children && reply?.children.length > 0;
  const [view, setView] = useState(true);
  


  return (

    <div key={reply?._id} className={`relative ${depth > 0 ? "ml-8": ``}`}>
      <div
        className="absolute top-0 left-0 h-full border-l border-time_header"
        style={{ marginLeft: "0.75rem" }} // align to margin
      />
      {/* for those comment those dont have child */}
      {!hasChildren &&  (
        <div
          className="absolute top-0 left-0 h-full border-l border-bg_comment_box"
          style={{ marginLeft: "0.75rem" }} // align to margin
        />
      )}
      {/* for those comment those dont have child */}
      {!view &&  (
        <div
          className="absolute top-0 left-0 h-full border-l border-bg_comment_box"
          style={{ marginLeft: "0.75rem" }} // align to margin
        />
      )}

      {hasChildren && (
        <div
          className={`absolute ${
            view ? "top-12 left-0" : "top-6 left-4"
          } left-0 h-full z-30`}
          style={{ marginLeft: "0rem" }}
        >
          {view && (
            <button
              onClick={() => setView(!view)}
              className="w-6 h-6 rounded-full text-text_header bg-btn_bg cursor-pointer"
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
            // aligns roughly to avatar middle
            left: "-1.25rem",
            width: "2rem", // horizontal length to reach comment box
            height: "1rem",
          }}
        />
      )}

      {isLastChild && (
        <div
          className="absolute left-0 w-1  h-full bg-bg_comment_box z-10"
          style={{
            marginLeft: "-1.25rem",
          }}
        />
      )}

      {!view && (
        <div className="text-white flex items-center gap-2 z-40 pb-4">
          <button
            onClick={() => setView(!view)}
            className="w-6 h-6 z-40 flex items-center justify-center rounded-full text-text_header bg-btn_bg cursor-pointer"
          >
            +
          </button>
          <div className="w-8 h-8 flex-shrink-0">
          <UserIconCard id={reply?.userId} />
          </div>
          <UserNameCard id= {reply?.userId}/>
        </div>
      )}

       {/* Thread connector dot */}
      {reply && (
        <ShowReplyContent
          reply={reply}
          hasChildren={hasChildren}
          onReplyDeleted={onReplyDeleted} // Pass down the delete handler
        />
      )}

      {/* Render children if expanded or not too deep */}
      {hasChildren && view && (
        <div className="">
          {reply?.children.map((childReply,index) => (
            <div key={childReply._id}>
              <RecurrsionLoop
                reply={childReply}
                depth={depth + 1}
                isLastChild={index === reply.children.length - 1}
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
