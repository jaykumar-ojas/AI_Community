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

  
  // if (!challengeData) return <div className="p-6 text-gray-400">No challenge data found.</div>;

  // const { text = "i m jay", imageUrl="https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/b741942e1e968f5e52695eec7ff426c30f1f9a4e01d612768f2fd99bc86711e5.webp", videoUrl="", createdAt, updatedAt } = challengeData;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 bg-nav_hover rounded-2xl border border-nav_hover3">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-100">Challenge Entry</h2>
        </div>
      </div>

      {/* Text content */}
        <div className="prose max-w-none text-gray-200 whitespace-pre-wrap">
          this is prompt fo rthat rouned one and i m mahya
        </div>

        <div className="rounded-lg overflow-hidden border border-white/6">
          <img
            src={ "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/b741942e1e968f5e52695eec7ff426c30f1f9a4e01d612768f2fd99bc86711e5.webp"}
            alt={ "challenge image"}
            className="w-full object-cover"
            style={{ maxHeight: 480 }}
          />
        </div>

      {/* Video */}
      {/* {videoUrl && videoUrl.fileUrl && (
        <div className="rounded-lg overflow-hidden border border-white/6">
          <video controls style={{ width: "100%" }} src={videoUrl.fileUrl}>
            Your browser does not support the video tag.
          </video>
          <div className="p-2 text-xs text-gray-400">
            {videoUrl.fileName} • {videoUrl.fileSize ? `${Math.round(videoUrl.fileSize / 1024)} KB` : ""}
          </div>
        </div>
      )} */}

      <div className="text-xs text-gray-500">Last updated</div>
    </div>
  );
}
