// src/components/ChallengeContent.jsx
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils"; // your helper
const baseUrl = "http://localhost:8099"; // adjust if different

function formatDateIso(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

const fetchChallenge = async (challengeId) => {
  const headers = getAuthHeaders() || { "Content-Type": "application/json" };
  // make sure Content-Type present
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}/challenges/data`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id: challengeId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(err.message || "Failed to fetch challenge data");
  }

  const json = await res.json();
  return json.data;
};

export default function ChallengeContent() {
  const { challangeId } = useParams(); // spelled like your schema
  const queryClient = useQueryClient();

  const {
    data: challengeData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["challengeData", challangeId],
    queryFn: () => fetchChallenge(challangeId),
    enabled: !!challangeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Like toggle mutation
  const likeMutation = useMutation({
    mutationFn: async ({ userId }) => {
      const headers = getAuthHeaders() || { "Content-Type": "application/json" };
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";

      const res = await fetch(`${baseUrl}/challenges/${challangeId}/like`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Like failed" }));
        throw new Error(err.message || "Like failed");
      }
      return res.json();
    },
    onSuccess: (resp) => {
      // refetch the challenge data to pick up updated likes
      queryClient.invalidateQueries({ queryKey: ["challengeData", challangeId] });
    },
  });

  const likesCount = useMemo(() => {
    if (!challengeData) return 0;
    return Array.isArray(challengeData.likes) ? challengeData.likes.length : 0;
  }, [challengeData]);

  // NOTE: determine currentUserId: either parse token or pass from parent/context.
  // Here we show how to call likeMutation: likeMutation.mutate({ userId: "..." })
  // Replace `currentUserId` below with real authenticated user id.
  const currentUserId = null; // <-- replace with your auth logic

  const onToggleLike = () => {
    if (!currentUserId) {
      alert("Please login to like this post.");
      return;
    }
    likeMutation.mutate({ userId: currentUserId });
  };

  if (isLoading) return <div className="p-6 text-gray-400">Loading challenge...</div>;
  if (isError) return <div className="p-6 text-red-400">Error: {error.message}</div>;
  if (!challengeData) return <div className="p-6 text-gray-400">No challenge data found.</div>;

  const { text = "", imageUrl, videoUrl, createdAt, updatedAt } = challengeData;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 bg-nav_hover rounded-2xl border border-nav_hover3">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-100">Challenge Entry</h2>
          <div className="text-sm text-gray-400 mt-1">Submitted: {formatDateIso(createdAt)}</div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Likes</div>
          <div className="text-lg font-bold text-gray-100">{likesCount}</div>
          <button
            onClick={onToggleLike}
            disabled={likeMutation.isLoading}
            className="mt-2 px-3 py-1 rounded-lg bg-white/6 hover:bg-white/5"
          >
            {likeMutation.isLoading ? "..." : "Like / Unlike"}
          </button>
        </div>
      </div>

      {/* Text content */}
      {text && (
        <div className="prose max-w-none text-gray-200 whitespace-pre-wrap">
          {text}
        </div>
      )}

      {/* Image */}
      {imageUrl && imageUrl.fileUrl && (
        <div className="rounded-lg overflow-hidden border border-white/6">
          <img
            src={imageUrl.fileUrl}
            alt={imageUrl.fileName || "challenge image"}
            className="w-full object-cover"
            style={{ maxHeight: 480 }}
          />
          <div className="p-2 text-xs text-gray-400">
            {imageUrl.fileName} • {imageUrl.fileSize ? `${Math.round(imageUrl.fileSize / 1024)} KB` : ""}
          </div>
        </div>
      )}

      {/* Video */}
      {videoUrl && videoUrl.fileUrl && (
        <div className="rounded-lg overflow-hidden border border-white/6">
          <video controls style={{ width: "100%" }} src={videoUrl.fileUrl}>
            Your browser does not support the video tag.
          </video>
          <div className="p-2 text-xs text-gray-400">
            {videoUrl.fileName} • {videoUrl.fileSize ? `${Math.round(videoUrl.fileSize / 1024)} KB` : ""}
          </div>
        </div>
      )}

      {/* Likes list (optional) */}
      {Array.isArray(challengeData.likes) && challengeData.likes.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {challengeData.likes.slice(0, 8).map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* if likes are ObjectIds and you didn't populate, u may be an id string */}
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.name || "user"} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  {u.name ? u.name[0] : "U"}
                </div>
              )}
              <div className="text-xs text-gray-300">{u.name || String(u).slice(0, 6)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500">Last updated: {formatDateIso(updatedAt)}</div>
    </div>
  );
}
