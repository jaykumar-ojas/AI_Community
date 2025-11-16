import React, { useContext, useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Clock, ChevronRight } from "lucide-react";
import { formatDate } from "../AiForumPage/components/ForumUtils";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import { LoginContext } from "../ContextProvider/context";
import { encodeId } from "../../utils/hashids";
import { DeleteIcon, ReloadIcon } from "../../asset/icons";

/**
 * NotificationComponent — TanStack/react-query (useInfiniteQuery) compatible
 * - Auto infinite-scroll (IntersectionObserver)
 * - No "Load more" button
 * - Prop `setUnread` is called with server unreadCount when pages load
 *
 * Props:
 *  - onClose: function
 *  - unread: number (optional)
 *  - setUnread: function(unreadCount)  <-- required to keep parent in sync
 */
const NotificationComponent = ({ onClose, unread, setUnread }) => {
  const { loginData } = useContext(LoginContext);
  const userId = loginData?.validuserone?._id;
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const qc = useQueryClient();
  const mountedRef = useRef(false);
  const sentinelRef = useRef(null);

  // fetch function for a given pageParam
  const fetchNotificationsPage = async ({ pageParam = 1 }) => {
    if (!userId) return { items: [], totalCount: 0, unreadCount: 0, page: pageParam };
    const token = localStorage.getItem("userdatatoken");
    const res = await fetch(`${baseUrl}/getNotification/${userId}?page=${pageParam}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch notifications");
    }
    const json = await res.json();
    const items = json.data ?? [];
    const totalCount = Number(json.totalCount ?? 0);
    const unreadCount = Number(json.unreadCount ?? 0);
    const page = Number(json.page ?? pageParam);
    return { items, totalCount, unreadCount, page };
  };

  // useInfiniteQuery
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", userId],
    queryFn: fetchNotificationsPage,
    enabled: !!userId,
    getNextPageParam: (lastPage, allPages) => {
      const accumulated = allPages.reduce((acc, p) => acc + (p.items?.length ?? 0), 0);
      if ((lastPage.totalCount ?? 0) > accumulated) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  // derived values
  const pages = data?.pages ?? [];
  const items = pages.flatMap((p) => p.items ?? []);
  const totalCount = pages?.[0]?.totalCount ?? 0;
  const unreadCountFromServer = pages?.[0]?.unreadCount ?? 0;

  // keep parent unread in sync whenever pages change
  

  // mark-all-read on first mount (optimistic update)
  useEffect(() => {
    if (!userId) return;
    if (mountedRef.current) return;
    mountedRef.current = true;

    const doMarkAllRead = async () => {
      try {
        const token = localStorage.getItem("userdatatoken");
        const res = await fetch(`${baseUrl}/getNotification/${userId}/mark-all-read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        });
        if (res.ok) {
          // optimistic cache update: mark all fetched items as read and set unreadCount to 0
          qc.setQueryData(["notifications", userId], (old) => {
            if (!old) return old;
            const newPages = old.pages.map((pg) => ({
              ...pg,
              items: (pg.items ?? []).map((it) => ({ ...it, read: true })),
              unreadCount: 0,
            }));
            return { ...old, pages: newPages };
          });
          // update parent unread too
          if (typeof setUnread === "function") setUnread(0);
          qc.invalidateQueries({ queryKey: ["notifications", userId], exact: false });
        }
      } catch (e) {
        console.error("mark-all-read failed", e);
      }
    };

    // wait briefly so first page fetch starts, then mark-all-read
    setTimeout(() => doMarkAllRead(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // single item actions: mark-read
  const onMarkRead = async (id) => {
    if (!userId || !id) return;
    try {
      const token = localStorage.getItem("userdatatoken");
      const res = await fetch(`${baseUrl}/getNotification/${userId}/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        // update cache: set that item's read = true
        qc.setQueryData(["notifications", userId], (old) => {
          if (!old) return old;
          const newPages = old.pages.map((pg) => ({
            ...pg,
            items: (pg.items ?? []).map((it) => (it._id === id || it.id === id ? { ...it, read: true } : it)),
            // conservative unreadCount adjust
            unreadCount: Math.max(0, (pg.unreadCount ?? 0) - (pg.items?.some((it) => (it._id === id || it.id === id) && !it.read) ? 1 : 0)),
          }));
          return { ...old, pages: newPages };
        });
        qc.invalidateQueries({ queryKey: ["notifications", userId], exact: false });
      }
    } catch (e) {
      console.error("onMarkRead error", e);
    }
  };

  // dismiss (delete) notification
  const onDismiss = async (id) => {
    if (!userId || !id) return;
    try {
      const token = localStorage.getItem("userdatatoken");
      const res = await fetch(`${baseUrl}/getNotification/${userId}/dismiss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        // update cache: remove the item and decrement totalCount
        qc.setQueryData(["notifications", userId], (old) => {
          if (!old) return old;
          const newPages = old.pages.map((pg) => ({
            ...pg,
            items: (pg.items ?? []).filter((it) => !(it._id === id || it.id === id)),
          }));
          if (newPages[0]) {
            newPages[0] = { ...newPages[0], totalCount: Math.max(0, (newPages[0].totalCount ?? 0) - 1) };
          }
          return { ...old, pages: newPages };
        });
        qc.invalidateQueries({ queryKey: ["notifications", userId], exact: false });
      }
    } catch (e) {
      console.error("onDismiss error", e);
    }
  };

  // navigation helper
  const handleNav = (notif) => {
    const { postId, topicId, commentId } = notif;
    let url = "#";
    if (postId && commentId) url = `/userPost/${postId}/${commentId}`;
    else if (postId) url = `/userPost/${postId}`;
    else if (topicId && commentId) url = `/forum/topic/${encodeId(topicId)}/${encodeId(commentId)}`;
    else if (topicId) url = `/forum/topic/${encodeId(topicId)}`;
    window.location.href = url;
    onClose?.();
  };

  // infinite-scroll: observe sentinel and fetch next page when visible
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const showingCount = items.length;
  const canLoadMore = Boolean(hasNextPage);

return (
  <div
    className="w-full sm:max-h-[70vh] h-[calc(100vh-8rem)] flex flex-col overflow-hidden sm:rounded-2xl
               bg-bg_dark sm:bg-[rgba(12,14,16,0.55)]/80 backdrop-blur-[14px] sm:border border-[rgba(255,255,255,0.04)]
               shadow-[0_12px_40px_rgba(2,6,23,0.75)] ring-1 ring-black/20"
  >
    {/* Header */}
    <div className="sticky top-0 z-30 sm:px-3 px-2 sm:py-2 flex items-center justify-between gap-4
                    bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent
                    border-b border-[rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center h-11 w-11 rounded-xl
                     bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.01)]
                     ring-1 ring-[rgba(255,255,255,0.03)]"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-800/20 to-cyan-600/10">
            <Bell className="w-5 h-5 text-theme_color drop-shadow-sm" />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">Notifications</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            {unreadCountFromServer > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-full
                                 bg-gradient-to-br from-rose-500 to-red-500 text-white drop-shadow-[0_6px_18px_rgba(220,38,38,0.12)]">
                  {unreadCountFromServer > 10 ? "10+" : unreadCountFromServer}
                </span>
                <span className="text-zinc-400">unread</span>
              </span>
            ) : (
              <span className="text-zinc-500">{`${showingCount} shown`}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["notifications", userId] })}
          className="text-sm px-3 py-1.5 rounded-md bg-nav_hover3 hover:bg-[rgba(255,255,255,0.035)]
                      text-zinc-200 transition transform hover:-translate-y-[1px]"
        >
          <ReloadIcon/>
        </button>

        <button
          onClick={async () => {
            if (!userId) return;
            try {
              const token = localStorage.getItem("userdatatoken");
              const r = await fetch(`${baseUrl}/getNotification/${userId}/mark-all-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
              });
              if (r.ok) {
                qc.setQueryData(["notifications", userId], (old) => {
                  if (!old) return old;
                  const newPages = old.pages.map((pg) => ({
                    ...pg,
                    items: (pg.items ?? []).map((it) => ({ ...it, read: true })),
                    unreadCount: 0,
                  }));
                  return { ...old, pages: newPages };
                });
                if (typeof setUnread === "function") setUnread(0);
                qc.invalidateQueries({ queryKey: ["notifications", userId] });
              }
            } catch (e) {
              console.error("mark-all-read manual failed", e);
            }
          }}
          className="text-sm px-3 py-1.5 rounded-md bg-nav_hover3
                     text-zinc-200 border border-[rgba(255,255,255,0.03)] hover:brightness-105 transition"
        >
          Mark all
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent p-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-14 text-zinc-400">
          <div className="animate-spin h-5 w-5 mr-3 border-2 border-cyan-500 border-t-transparent rounded-full" />
          <span className="text-sm">Loading notifications...</span>
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-rose-400">
          <p className="mb-3">Error fetching notifications.</p>
          <button
            className="text-sm px-4 py-2 rounded-md bg-gradient-to-br from-rose-600 to-red-500 text-white"
            onClick={() => qc.invalidateQueries({ queryKey: ["notifications", userId] })}
          >
            Try again
          </button>
        </div>
      ) : items?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <div className="p-4 rounded-full bg-[rgba(255,255,255,0.02)] mb-4">
            <Bell className="w-8 h-8 opacity-40 text-cyan-300" />
          </div>
          <p className="text-sm text-zinc-300">No notifications yet</p>
          <p className="text-xs text-zinc-500 mt-2">You're all caught up 🎉</p>
        </div>
      ) : (
        <ul className="sm:space-y-2">
          {items.map((n) => {
            const isUnread = !n.read;
            const id = n._id ?? n.id;
            return (
              <li
                key={id}
                className="relative group flex items-start gap-3 sm:p-2 py-2 px-1 rounded-xl
                           sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.005))]
                          
                           transition-transform transform-gpu sm:hover:-translate-y-1 sm:hover:shadow-[0_10px_30px_rgba(2,6,23,0.6)]"
              >
                <div className="flex-shrink-0">
                  <div
                    className="relative h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center
                               "
                  >
                    {n.replierId ? (
                      <UserIconCard id={n.replierId} />
                    ) : (
                      <div className="text-xs text-zinc-400 uppercase">{n.field?.[0] ?? "?"}</div>
                    )}

                    {isUnread && (
                      <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full
                                       bg-gradient-to-br from-rose-500 to-red-500 ring-2 ring-black" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0" onClick={() => handleNav(n)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`text-sm leading-6 truncate ${isUnread ? "text-white font-semibold" : "text-zinc-300"}`}
                        title={n.desc}
                      >
                        {n.desc}
                      </p>

                      <div className=" flex items-center gap-3 text-xs text-zinc-400">
                        {n.replierId && (
                          <div className="truncate">
                            <UserNameCard id={n.replierId} size={6}  />
                          </div>
                        )}

                        <span className="inline-flex items-center px-2 py-0.5 rounded uppercase bg-[rgba(0,0,0,0.35)]
                                         text-zinc-300 text-[11px] ring-1 ring-[rgba(255,255,255,0.02)]">
                          {n.field}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{formatDate(n.createdAt)}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await onMarkRead(id);
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] transition"
                          >
                            Mark
                          </button>
                        )}

                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onDismiss(id);
                          }}
                          className="p-1 rounded-md bg-transparent text-low_text hover:text-red-500 sm:hover:bg-[rgba(255,255,255,0.03)] transition"
                        >
                          <DeleteIcon size={4}  />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {/* sentinel for infinite scroll */}
          <li ref={sentinelRef} className="h-3" />
        </ul>
      )}

      {/* next page loader */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-3 text-zinc-400">
          <div className="animate-spin h-4 w-4 mr-2 border-2 border-cyan-500 border-t-transparent rounded-full" />
          <span className="text-xs">Loading more...</span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="px-5 py-3 sm:block hidden border-t border-[rgba(255,255,255,0.03)] flex items-center justify-between gap-3 bg-gradient-to-t from-[rgba(255,255,255,0.01)] to-transparent">
      <div className="text-xs text-zinc-400">
        Showing <span className="text-white font-medium">{showingCount}</span> of <span className="text-white font-medium">{totalCount}</span>
      </div>

      
    </div>
  </div>
);



};

export default NotificationComponent;
