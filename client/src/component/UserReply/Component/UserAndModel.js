import React, { useContext } from "react";
import { ForumContext } from "../../ContextProvider/ModelContext";

const UserAndModel = () => {
    const { replyIdForContext,setReplyIdForContext, userName,model,setModel } = useContext(ForumContext);
  return (
    <>
      {replyIdForContext && (
        <span>
          Replying to{" "}
          <span className="font-medium text-blue-600">
            @{userName}
            <button
              onClick={() => setReplyIdForContext(null)}
              className="ml-2 text-gray-600 hover:text-red-600 font-bold"
              aria-label="Remove model"
            >
              ×
            </button>
          </span>
        </span>
      )}
      {model && (
        <span className="inline-flex items-center font-medium  ml-4 rounded-lg text-green-600 bg-gray-200 border border-gray-400">
          @{model}
          <button
            onClick={() => setModel(null)}
            className="ml-2 text-gray-600 hover:text-red-600 font-bold"
            aria-label="Remove model"
          >
            ×
          </button>
        </span>
      )}
    </>
  );
};

export default UserAndModel;
