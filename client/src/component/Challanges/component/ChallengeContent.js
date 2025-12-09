// src/components/ChallengeContent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils"; // your helper
import ChallengePost from "./ChallengePost";
import Masonry from "react-masonry-css";
import Card from "../../Card/Card";
import ChallengeCard from "./ChallengeCard";
import ChallengeTextPost from "./ChallengeTextPost";
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
  const { id } = useParams();
  const [challenge, setChallenge] = useState();
  // renamed state to avoid collision with imported component
  const [showChallengePost, setShowChallengePost] = useState(false);

  const breakpointColumnsObj = {
    default: 2,
    1024: 2,
    768: 2,
  };
  const ChallengeFetch = async () => {
    console.log("i m going to fetch challenge");
    const res = await fetch(`${baseUrl}/get/challenges/${id}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: id }),
    });
    console.log("i m coming to get challenge");
    console.log(res);
    const data = await res.json();
    console.log("i got my data");
    console.log(data, "this is my data");
    if (!res.ok) {
      alert("Not found any challenge for this data");
    }
    setChallenge(data.challenge);
  };

  useEffect(() => {
    ChallengeFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClose= ()=>{
    setShowChallengePost(false);
  }

  const {
    data: challengeData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["challengeData", id],
    queryFn: () => fetchChallenge(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  if (isLoading)
    return <div className="p-6 text-gray-400">Loading challenge...</div>;
  if (isError)
    return <div className="p-6 text-red-400">Error: {error.message}</div>;

  if (!challengeData)
    return <div className="p-6 text-gray-400">No challenge data found.</div>;

  return (
    <div className="w-full">
      <div className="w-full bg-nav_hover text-low_text rounded-xl p-2 mb-2 border border-gray-800 shadow-md">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold tracking-wide  text-purple-400">
            {challenge?.title}
          </div>
          <div className="inline-flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold text-yellow-300 border border-gray-700">
            {challenge?.rewardXP} XP
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-300 leading-relaxed">
            {challenge?.description}
          </div>
          {/* Use a function for onClick so it only runs on click */}
          <button
            onClick={() => setShowChallengePost(true)}
            className="bg-blue-400 text-black px-3 py-1 rounded"
          >
            complete it
          </button>
        </div>
      </div>

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-2"
        columnClassName="flex flex-col gap-2"
      >
        {challengeData.map((post) => (
          <div key={post?._id}>
            <ChallengeCard post={post} />
          </div>
        ))}
      </Masonry>
      {/* {showChallengePost && <ChallengePost onClose = {onClose} />} */}
      {showChallengePost && <ChallengeTextPost onClose = {onClose} />}
    </div>
  );
}
