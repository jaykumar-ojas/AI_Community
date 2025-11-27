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
import TopicData2 from "./components/TopicData2";

const fetchTopics = async (sortType, limit) => {
  try {
    const response = await axios.get(
      `${TOPICS_URL}?sort=${sortType}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      }
    );
   // console.log("i m coming from the data");
    return response.data.topics || [];
  } catch (error) {
    //console.log("sorry i m stuck");
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

 // console.log(fetchedTopics);

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
        {/* <button
          onClick={() => navigate("/forum")}
          className="text-sm md:text-sm text-theme_color hover:text-theme_color2 font-medium transition-colors"
        >
          View All →
        </button> */}
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
            <TopicData2 topic={topic}/>
            
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
