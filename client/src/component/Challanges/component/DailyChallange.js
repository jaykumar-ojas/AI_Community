// DailyChallenges.jsx
import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { getAuthHeaders, handleAuthError } from "../../AiForumPage/components/ForumUtils";
import { useQuery } from "@tanstack/react-query";
const baseUrl = process.env.REACT_APP_BASE_URL;


export default function DailyChallenges() {
  const { completed, toggleComplete, setSelectedId } = useOutletContext();
  const navigate = useNavigate();

//   const [challenges, setChallenges] = useState([]);
//   const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // get today's date in YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  async function fetchDaily(date = today) {
      console.log("i m going");

      const res = await fetch(`${baseUrl}/challenges/daily?date=${date}`,{
       method:'POST',
        headers:getAuthHeaders(),
      });
      // console.log(" im coing",res);
      const data = await res.json().catch(() => null);
      // console.log("this is data",data);

      if (!res.ok) throw new Error(data.message || "Failed to load challenges");

      return data?.challenges ?? [];
  }

  const {data:challenges = [],
    isLoading,
    isError,
    error,
    refetch} = useQuery({
        queryKey:["challenges",today],
        queryFn: ()=> fetchDaily(today),
        staleTime:1000*60*5,
        retry: false,
         onError: (err) => {
      // use the err that react-query provides; handleAuthError expects an Error
      if (handleAuthError(err)) return;
      console.error("Error fetching daily challenges:", err);
    },
        
    });

  // fetch today’s challenge on mount
//   useEffect(() => {
//     fetchDaily(today);
//   }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Challenges</h1>
          <p className="text-sm text-gray-400">
            Complete challenges to earn XP, badges and leaderboard points.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-gray-400">Loading daily challenges...</div>
      )}

      {error && (
        <div className="text-red-400 bg-red-400/10 p-2 rounded">
          {error?.message || "sorry failed to challange"}
        </div>
      )}

      {/* show message if no challenge */}
      {!isLoading && challenges?.length === 0 && !error && (
        <div className="text-gray-400 italic">
          No challenge found for today.
        </div>
      )}

      <div className="space-y-4">
        {challenges?.map((ch) => (
          <article
            key={ch?._id}
            className="bg-nav_hover border border-nav_hover3 rounded-2xl shadow p-4 flex gap-4 items-start"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {ch?.title?.split(" ")[0]}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-100">{ch?.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{ch?.description}</p>

                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      Reward:
                      <span className="font-medium text-gray-100">
                        {" "}
                        {ch?.rewardXP} XP
                      </span>
                    </span>
                    <span>•</span>
                    <span>Est: {ch?.estimatedTime}</span>
                  </div>
                </div>

                <div className="w-36 text-right">
                  <button
                    onClick={() => {
                      alert("i m coming inside");
                      navigate(`/challenges/daily/${ch?._id}`)
                    }}
                    className="mb-2 block w-full px-3 py-2 rounded-lg border border-white/6 bg-white/4 text-gray-100 hover:bg-white/6 transition"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => toggleComplete(ch.challengeId)}
                    className={`block w-full px-3 py-2 rounded-lg transition ${
                      completed[ch?.challengeId]
                        ? "bg-emerald-500 text-white"
                        : "bg-white/6 border border-white/6 text-gray-100"
                    }`}
                  >
                    {completed[ch?.challengeId]
                      ? "Completed"
                      : "Mark Complete"}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
