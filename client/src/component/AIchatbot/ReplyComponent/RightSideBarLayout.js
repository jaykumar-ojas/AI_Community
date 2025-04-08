// components/ReplyDrawer.jsx
import React, { useContext, useState } from "react";
import axios from "axios";
import { LoginContext } from "../../ContextProvider/context";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import { getAuthHeaders, handleAuthError, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import { X } from "lucide-react";

const ReplyDrawer = ({ isOpen, onClose, topic_id }) => {
  const { loginData } = useContext(LoginContext);
  const { emitNewReply } = useWebSocket();

  const [newReply, setNewReply] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handlePostReply = async () => {
    if (!loginData?.validuserone) {
      alert("Please log in to reply");
      return;
    }
    if (!newReply.trim()) {
      alert("Reply can't be empty");
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("content", newReply);
      formData.append("topicId", topic_id);
      formData.append("userId", loginData.validuserone._id);
      formData.append("userName", loginData.validuserone.userName);

      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post(REPLIES_URL, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      emitNewReply(response.data.reply);
      setNewReply("");
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      if (!handleAuthError(err, setError)) {
        console.error(err);
        setError("Failed to post reply.");
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "block" : "hidden"} z-50`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-full w-[400px] bg-white shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-sm font-semibold">Post a Reply</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-800" />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <textarea
            className="w-full border rounded-md p-3 text-sm resize-none h-28"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isPosting}
          />

          <div className="flex justify-between items-center mt-3">
            <label className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer">
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
              📎 Attach
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => alert("Image Generator coming soon")}
                className="text-sm text-gray-500 hover:text-blue-600"
              >
                🖼 Generate
              </button>
              <button
                onClick={() => alert("AI Response coming soon")}
                className="text-sm text-gray-500 hover:text-blue-600"
              >
                🤖 AI
              </button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="relative bg-gray-100 rounded-md px-2 py-1 text-xs text-gray-700 flex items-center"
                >
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={() =>
                      setSelectedFiles((files) => files.filter((_, i) => i !== idx))
                    }
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handlePostReply}
            className="mt-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 px-4 text-sm mt-4 disabled:opacity-50"
            disabled={isPosting || !newReply.trim()}
          >
            {isPosting ? "Posting..." : "Post Reply"}
          </button>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
      </aside>
    </div>
  );
};

export default ReplyDrawer;
