import React, { useContext, useState, useEffect, useRef } from "react";
import {
  getAuthHeaders,
  handleAuthError,
  TOPICS_URL,
} from "./components/ForumUtils";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { encodeId } from "../../utils/hashids";
import { CommentIcon, LeftIcon, RightArrowIcon } from "../../asset/icons";
import { EyeIcon } from "lucide-react";

const fetchTopics = async (sortType, limit) => {
  try {
    const response = await axios.get(
      `${TOPICS_URL}?sort=${sortType}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      }
    );
    console.log("i m coming from the data");
    return response.data.topics || [];
  } catch (error) {
    console.log("sorry i m stuck");
    if (!handleAuthError(error)) {
      console.error("Error fetching topics:", error);
    }
    return [];
  }
};
const ForumTicker = ({ sortType = "popular", limit = 20 }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: fetchedTopics = [], isLoading } = useQuery({
    queryKey: ["topicCommunities", sortType, limit],
    queryFn: () => fetchTopics(sortType, limit),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    };

    checkScroll(); // initial check
    el.addEventListener("scroll", checkScroll);

    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  console.log(fetchedTopics);

  // Check scroll position to show/hide navigation buttons

  const handleTopicClick = (topic) => {
    navigate(`/forum/topic/${encodeId(topic._id)}`);
  };

  if (isLoading) {
    return (
      <div className="mb-4 md:mb-6 px-2 md:px-4">
        <div className="flex gap-3 md:gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] md:w-[320px] h-[180px] md:h-[200px] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between  md:mb-1">
        <h2 className="text-lg md:text-md font-semibold text-gray-900 dark:text-low_text font-inter">
          Popular Communities
        </h2>
        <button
          onClick={() => navigate("/forum")}
          className="text-sm md:text-sm text-theme_color hover:text-theme_color2 font-medium transition-colors"
        >
          View All →
        </button>
      </div>
      {canScrollLeft && (
        <button
          onClick={() =>
            scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
          }
          className="absolute z-20 left-0 top-1/2 -translate-y-1/2 rounded-full border-2 text-white p-2 rounded transition-all duration-200
             active:scale-90"
        >
          <RightArrowIcon />
        </button>
      )}

      {/* Scrollable Container */}
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar pb-2">
        <div className="flex md:gap-2">
          {fetchedTopics.map((topic) => (
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
                    topic.mediaAttachments[0]?.fileType?.startsWith(
                      "image"
                    )) && (
                    <img
                      src={topic.imageUrl || topic.mediaAttachments[0].fileUrl}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}

                  {/* If it's a video */}
                  {topic.mediaAttachments?.length > 0 &&
                    topic.mediaAttachments[0]?.fileType?.startsWith(
                      "video"
                    ) && (
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
                      <EyeIcon size={12} /> {topic.viewCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {canScrollRight && (
        <button
          onClick={() =>
            scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
          }
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border-2  text-white p-2 transition-all duration-200 active:scale-90"
        >
          <LeftIcon />
        </button>
      )}
    </div>
  );

  // return (
  //     <div className="text-white">
  //         i m here for sure
  //     </div>
  // )
};

export default ForumTicker;
