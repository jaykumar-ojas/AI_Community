import React, { useContext, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Card from "../../component/Card/Card";
import ForumSystem from "../../component/AiForumPage/ForumSystem";
import Loader from "../../component/Loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import { MasonrySkeletonGrid } from "./MansorySkeletonGrid";
import { LoginContext } from "../../component/ContextProvider/context";
import { handleGoogleLogin, validateToken } from "../../utils/authUtils";
import { useNavigate, useOutletContext } from "react-router-dom";
import ForumTicker from "../../component/AiForumPage/ForumTicker";
const baseUrl = process.env.REACT_APP_BASE_URL;

const fetchPosts = async ({ pageParam = 1 }) => {
  const res = await fetch(`${baseUrl}/allget?page=${pageParam}&limit=9`);
  return res.json();
};

const Page = () => {
  const history = useNavigate();
  const { loginData, setLoginData } = useContext(LoginContext);
  const { showForum, setShowForum } = useOutletContext();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["posts"],
      queryFn: fetchPosts,
      getNextPageParam: (lastPage, pages) => {
        return lastPage.hasMore ? pages.length + 1 : undefined;
      },
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
    });

  const allPosts = data?.pages.flatMap((page) => page.userposts) || [];

  const validateUser = async () => {
    try {
      handleGoogleLogin();
      const userData = await validateToken();
      if (userData) {
        setLoginData(userData);
      } else if (!loginData) {
        history("/");
      }
    } catch (err) {
      console.error("Validation error", err);
    }
  };

  useEffect(() => {
    validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Demo overlay storage keys & state ----------------
  const SESSION_CLOSED_KEY = "pixxelmind_demo_closed_session";
  const PERSIST_KEY = "pixxelmind_demo_dont_show";

  // Initial states: check localStorage (persistent) and sessionStorage (closed this session)
  const [showDemo, setShowDemo] = useState(() => {
    try {
      const persist = localStorage.getItem(PERSIST_KEY) === "1";
      const closedSession = sessionStorage.getItem(SESSION_CLOSED_KEY) === "1";
      return !(persist || closedSession);
    } catch {
      return true; // fallback to show if storage is unavailable
    }
  });

  const [dontShowAgain, setDontShowAgain] = useState(() => {
    try {
      return localStorage.getItem(PERSIST_KEY) === "1";
    } catch {
      return false;
    }
  });

  // demo video path — put the video in public/pixxelDemo.mp4
  const demoVideoUrl = "/demo.mp4";

  // Prevent body scroll when demo is visible
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showDemo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev || "";
    }
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [showDemo]);

  const closeDemo = () => {
    setShowDemo(false);
    try {
      // Mark closed for this session (prevents re-show while tab is open)
      sessionStorage.setItem(SESSION_CLOSED_KEY, "1");

      // If "Don't show again" checked, persist permanently
      if (dontShowAgain) {
        localStorage.setItem(PERSIST_KEY, "1");
      }
    } catch (err) {
      // ignore storage errors
      // console.warn("Storage error:", err);
    }
  };

  // Optional: allow user to uncheck "Don't show again" while modal is open and reflect it immediately in state.
  const handleDontShowAgainChange = (checked) => {
    setDontShowAgain(checked);
    try {
      if (checked) {
        localStorage.setItem(PERSIST_KEY, "1");
      } else {
        localStorage.removeItem(PERSIST_KEY);
      }
    } catch (err) {
      // ignore
    }
  };

  // ---------------- Masonry breakpoints ----------------
  const breakpointColumnsObj = {
    default: 4,
    1024: 4,
    768: 2,
  };

  return (
    <>
      {/* ---------------- Demo overlay (orange + grey themed) ---------------- */}
      {showDemo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
        >
          {/* background dim */}
          <div
            className="absolute inset-0 bg-gray-900/60"
            onClick={closeDemo}
            aria-hidden="true"
          />

          {/* modal card */}
          <div className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-[#1f1f1f] border border-gray-700">
            {/* close button */}
            <button
              onClick={closeDemo}
              aria-label="Close demo"
              className="absolute top-3 right-3 z-20 text-white hover:text-orange-400 transition text-lg p-1 rounded-full"
            >
              ✕
            </button>

            {/* video */}
            <div className="w-full bg-black">
              <video
                src={demoVideoUrl}
                autoPlay
                muted
                playsInline
                loop
                className="w-full h-auto object-cover"
              />
            </div>

            {/* footer: actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-[#2a2a2a]">
              <label className="flex items-center gap-2 text-sm text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => handleDontShowAgainChange(e.target.checked)}
                  className="accent-orange-500"
                />
                Don't show again
              </label>

              <button
                onClick={closeDemo}
                className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Main page layout ---------------- */}
      <div className="relative h-full overflow-hidden">
        <div className="relative z-10 overflow-hidden">
          <div className="mx-auto md:pb-0 pb-20">
            <div className="flex flex-col md:flex-row gap-4 lg:gap-2">
              {/* Main content area */}
              <div
                className={classNames(
                  "transition-all duration-300 md:w-[70%] ease-in-out md:pl-2",
                  showForum ? "hidden sm:flex sm:flex-1" : "flex-1"
                )}
              >
                {isLoading ? (
                  <MasonrySkeletonGrid />
                ) : allPosts.length > 0 ? (
                  <InfiniteScroll
                    dataLength={allPosts.length}
                    next={fetchNextPage}
                    hasMore={hasNextPage}
                    loader={
                      <div className="flex justify-center my-4">
                        <Loader />
                      </div>
                    }
                    scrollThreshold="90%"
                    scrollableTarget="scrollableDiv"
                    className="overflow-visible"
                  >
                    <div
                      id="scrollableDiv"
                      className="sm:h-[calc(100vh-4rem)] h-[calc(100vh-7.2rem)] relative overflow-y-auto no-scrollbar" // i change it dont know the effect on infinite scroll
                    >
                      {/* Desktop: Multi-column masonry */}
                      {/* <ForumTicker/>                       */}
                      <div>
                        <Masonry
                          breakpointCols={breakpointColumnsObj}
                          className="flex gap-2"
                          columnClassName="flex flex-col gap-2"
                        >
                          {allPosts.map((post) => (
                            <div key={post?._id}>
                              <Card post={post} />
                            </div>
                          ))}
                        </Masonry>
                      </div>
                    </div>
                  </InfiniteScroll>
                ) : (
                  <div className="text-center text-gray-300 text-lg mt-8">
                    No posts available
                  </div>
                )}
              </div>

              {/* Desktop Forum Sidebar */}
              <div
                className={classNames(
                  "lg:w-[25%] md:w-[30%] relative transition-all duration-300 ease-in-out"
                )}
              >
                <div className="sticky h-[calc(100vh-4rem)] overflow-hidden">
                  <ForumSystem />
                </div>
              </div>

              {/* Mobile Forum Overlay */}
              <div
                className="sm:hidden block fixed inset-0 z-40 transition-all duration-300 ease-in-out"
                style={{
                  transform: showForum ? "translateX(0)" : "translateX(100%)",
                  visibility: "visible",
                  pointerEvents: showForum ? "auto" : "none",
                }}
              >
                <div className="h-full pt-12 pb-12 bg-white dark:bg-black overflow-hidden">
                  <ForumSystem />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
};

export default Page;
