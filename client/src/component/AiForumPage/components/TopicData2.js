import React, { useContext, useEffect, useState } from "react";
import UserJoined from "./UserJoined";
import { LoginContext } from "../../ContextProvider/context";
import {
  DisLikeIcon,
  LikeIcon,
  UpvoteIcon,
  DownvoteIcon,
  CommentIcon,
} from "../../../asset/icons";
import UserNameCard from "../../Card/UserNameCard";
import UserIconCard from "../../Card/UserIconCard";
import { EyeIcon } from "lucide-react";
import { useWebSocket } from "./WebSocketContext";
import { getAuthHeaders, TOPICS_URL } from "./ForumUtils";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../ContextProvider/NotificationContext";
import axios from "axios";
import { encodeId } from "../../../utils/hashids";

const TopicData2 = ({ topic }) => {
  const navigate = useNavigate();
  const { loginData } = useContext(LoginContext);
  const [isJoined,setIsJoined] = useState(false);
  
  useEffect(() => {
    if (topic) {
      const isMember = topic.joined.includes(loginData?.validuserone?._id)
        ? true
        : false;
      setIsJoined(isMember);
    }
  }, [topic]);

  const handleTopicClick = (topic) => {
    navigate(`/forum/topic/${encodeId(topic._id)}`);
  };



  return (
    <div
      key={topic._id}
      onClick={() => handleTopicClick(topic)}
      className="group flex-shrink-0 w-[280px] md:w-[300px] bg-white dark:bg-nav_hover border border-gray-200 dark:border-nav_hover3 rounded-xl overflow-hidden cursor-pointer"
    >
      {/* Image */}
      {topic.imageUrl || topic.mediaAttachments?.length > 0 ? (
        <div className="relative h-[120px] md:h-[130px] overflow-hidden">
          {/* If it's an image */}
          {(topic.imageUrl ||
            topic.mediaAttachments[0]?.fileType?.startsWith("image")) && (
            <img
              src={topic.imageUrl || topic.mediaAttachments[0].fileUrl}
              alt={topic.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          )}

          {/* If it's a video */}
          {topic.mediaAttachments?.length > 0 &&
            topic.mediaAttachments[0]?.fileType?.startsWith("video") && (
              <video
                src={topic.mediaAttachments[0].fileUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )}
        </div>
      ) : (
        <div className="h-[120px] md:h-[130px] bg-gradient-to-br from-theme_color to-theme_color2 flex items-center justify-center"></div>
      )}

      {/* Content */}
      <div className="p-3 md:p-1 flex flex-col justify-between">
        <div className="md:text-sm font-semibold font-merriweather text-gray-900 dark:text-low_text line-clamp-2 mb-2 group-hover:text-theme_color4 transition">
          {topic.title}
        </div>

        <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400 px-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full overflow-hidden">
              <UserIconCard id={topic?.userId} />
            </div>
            <span className="truncate max-w-[100px] md:max-w-[150px] dark:text-gray-300">
              <UserNameCard id={topic?.userId} hover={false} size={4} />
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs flex-shrink-0">
            <span className="flex items-center gap-1">
              <CommentIcon h={4} /> {topic.replyCount || 0}
            </span>
            <span className="flex items-center gap-1">
             <UserJoined topic={topic} isJoined={isJoined} setIsJoined={setIsJoined}/>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicData2;
