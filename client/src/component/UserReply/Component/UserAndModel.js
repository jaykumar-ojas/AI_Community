import React, { useContext } from "react";
import { ForumContext } from "../../ContextProvider/ModelContext";
import { CommentContext } from "../../ContextProvider/CommentModelContext";

const UserAndModel = ({forum=false}) => {
  const forumContext = useContext(ForumContext);
  const commentContext = useContext(CommentContext);
  const { replyIdForContext,setReplyIdForContext, userName,model,setModel } = 
  forum ? forumContext : commentContext;
  return (
    <div className="md:px-1 pb-0 px-2">
      {replyIdForContext && (
        <span className="text-[11px] text-gray-600 dark:text-low_text">
          Replying to{" "}
          <span className="md:font-medium font-bold text-xs md:text-[13px] text-theme_color2">
            @{userName}
            <button
              onClick={() => setReplyIdForContext(null)}
              className="ml-2 text-gray-600 dark:text-time_header hover:text-red-600 font-bold"
              aria-label="Remove model"
            >
              ×
            </button>
          </span>
        </span>
      )}
      {model && (
        <span className="inline-flex items-center md:font-medium font-bold md:text-[13px] text-xs rounded-lg text-theme_color px-1">
          @{model}
          <button
            onClick={() => setModel(null)}
            className="ml-2 text-gray-600 dark:text-time_header hover:text-red-600 font-bold"
            aria-label="Remove model"
          >
            ×
          </button>
        </span>
      )}
    </div>
  );
};

export default UserAndModel;
