import React, { useContext, useState } from "react";
import { getAuthHeaders } from "./ForumUtils";
import { LoginContext } from "../../ContextProvider/context";
import { UserIcon } from "lucide-react";
const baseUrl = process.env.REACT_APP_BASE_URL;
// Props:
// - topicId: id of the topic to join
// - joined (optional): initial joined state (boolean)
const UserJoined = ({ topic, isJoined = false,setIsJoined }) => {
  const { loginData } = useContext(LoginContext);
  const userId = loginData?.validuserone?._id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async (e) => {
    alert("i come inside");
    if (e && typeof e.stopPropagation === "function") {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!userId) {
      setError("You must be logged in to join.");
      return;
    }
    if (!topic?._id) {
      setError("Missing topic id.");
      return;
    }

    setError(null);
    setLoading(true);

    // optimistic update
    setIsJoined(true);

    try {
      const res = await fetch(`${baseUrl}/forum/topic/joined/${topic?._id}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId:loginData?.validuserone?._id }),
      });

      console.log("i m coimg bakc");

      const data = await res.json();
      console.log("i recivev data", data);

      if (!res.ok) {
        // rollback optimistic update
        setIsJoined(false);
        throw new Error(data?.message || "Failed to join");
      }

      // success -> ensure state matches server
      setIsJoined(true);
    } catch (err) {
      console.error("Join error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
        <div className="flex text-xs text-low_text items-center justify-center  ">
            <UserIcon size={16}/>
        <div className="text-xs text-low_text">{topic?.joined?.length}</div>
        </div>
        
      {!isJoined ? (
        <button
          type="button"
          className="text-low_black text-md px-3 font-bold bg-theme_color p-1 rounded-lg"
          onClick={(e) => {
            e.stopPropagation(); // ⛔ stop click going to parent
            handleJoin(e);
          }}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join"}
        </button>
      ) : (
        <div className="text-xs text-low_text bg-nav_hover2 border border-nav_hover3 items-center justify-center font-poppins rounded-md p-1 font-semibold">joined</div>
      )}
    </div>
  );
};

export default UserJoined;
