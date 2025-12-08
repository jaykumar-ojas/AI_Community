import React, { useContext, useState } from "react";
import { getAuthHeaders } from "./ForumUtils";
import { LoginContext } from "../../ContextProvider/context";
import { UserIcon } from "lucide-react";
import { useNotification } from "../../ContextProvider/NotificationContext";
const baseUrl = process.env.REACT_APP_BASE_URL;
// Props:
// - topicId: id of the topic to join
// - joined (optional): initial joined state (boolean)
const UserJoined = ({ topic, isJoined = false, setIsJoined }) => {
  const { showNotification } = useNotification();
  const { loginData } = useContext(LoginContext);
  const userId = loginData?.validuserone?._id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [localCount, setLocalCount] = useState(topic?.joined?.length || 0);

  const handleJoin = async (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!userId) {
      showNotification("user must logged in");
      return;
    }
    if (!topic?._id) {
      setError("Missing topic id.");
      return;
    }

    setError(null);
    setLoading(true);
    setLocalCount(localCount+1);
    // optimistic update
    setIsJoined(true);

    try {
      const res = await fetch(`${baseUrl}/forum/topic/joined/${topic?._id}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: loginData?.validuserone?._id }),
      });

      
      const data = await res.json();

      if (!res.ok) {
        // rollback optimistic update
        setIsJoined(false);
        setLocalCount(localCount);
        throw new Error(data?.message || "Failed to join");
      }
      setIsJoined(true);
      // showNotification("successfully joined");
    } catch (err) {
      console.error("Join error:", err);
      showNotification("some error in joining")
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!topic ) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex text-xs text-low_text items-center justify-center">
          <UserIcon size={16} />
          <div className="text-xs text-low_text"></div>
        </div>
        <div
          className="w-10 h-5 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-nav_hover3"
          aria-hidden
        >
          {/* <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg> */}
        </div>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center gap-2">
      {localCount >0 && <div className="flex text-xs text-low_text items-center justify-center  ">
        <UserIcon size={16} />
        <div className="text-xs text-low_text">{localCount || topic?.joined?.length}</div>
      </div>}

      {!isJoined ? (
        <button
          type="button"
          className="text-black text-md px-3 font-bold bg-gradient-to-r from-blue-400 to-zinc-600 active:scale-90 py-1 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            handleJoin(e);
          }}
          disabled={loading}
        >
          {" "}
          {loading ? "Joining..." : "Join"}{" "}
        </button>
      ) : (
        <div className="text-xs text-low_text bg-nav_hover2 border border-nav_hover3 items-center justify-center font-poppins rounded-md p-1 font-semibold">
          Joined
        </div>
      )}
    </div>
  );
};

export default UserJoined;
