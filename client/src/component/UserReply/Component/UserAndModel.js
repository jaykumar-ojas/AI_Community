import React, { useContext } from "react";
import { ForumContext } from "../../ContextProvider/ModelContext";

const UserAndModel = () => {
    const { replyIdForContext,setReplyIdForContext, userName,model,setModel } = useContext(ForumContext);
  return (
    <div className="p-2">
      {replyIdForContext && (
        <span className="text-time_header">
          Replying to{" "}
          <span className="font-medium text-like_color">
            @{userName}
            <button
              onClick={() => setReplyIdForContext(null)}
              className="ml-2 text-time_header hover:text-red-600 font-bold"
              aria-label="Remove model"
            >
              ×
            </button>
          </span>
        </span>
      )}
      {model && (
        <span className="inline-flex items-center font-medium  ml-4 rounded-lg text-time_header bg-btn_bg px-1">
          @{model}
          <button
            onClick={() => setModel(null)}
            className="ml-2 text-time_header hover:text-red-600 font-bold"
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
