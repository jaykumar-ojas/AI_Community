// WeeklyChallenges.jsx
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { handleAuthError } from "../../AiForumPage/components/ForumUtils";


export default function WeeklyChallenges() {
  const { completed, toggleComplete, selectedId, setSelectedId } = useOutletContext();
  // const [weeklyChallengesData, setWeeklyChallengesData] = useState([]);
  // const [loading, setLoading] = useState(false);
  const weekStart = "2025-11-24"; // example — compute dynamically if you have calendar nav
  
  async function fetchWeekly() {
      // setLoading(true);
      try {
        const res = await fetch("http://localhost:8099/challenges/weekly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekStart }), // or { date: "2025-11-25" }
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Weekly fetch failed:", err);
          // setWeeklyChallengesData([]);
          // setLoading(false);
          return;
        }

        const data = await res.json();
        // setWeeklyChallengesData(data.challenges || []);
        return data.challenges || [];
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

  // useEffect(() => {
    

  //   fetchWeekly();
  // }, [weekStart]);


  const {data: weeklyChallengesData,
    isLoading,
    isError,
    error,
    refetch
  }=useQuery({
    queryKey:["weeklyCHallengesData",weekStart],
    queryFn:()=>fetchWeekly(),
    enabled : !!weekStart,
    staleTime: 1000*60*5,
    retry: false,
    onError: (error) => {
          if (handleAuthError(error)) return;
          console.error("Error fetching topic:", error);
        },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Weekly Challenges</h1>
          <p className="text-sm text-gray-400">
            Complete weekly challenges to earn higher XP and unlock rare badges.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {weeklyChallengesData?.map((ch) => (
          <article
            key={ch.id}
            className="bg-nav_hover border border-nav_hover3 rounded-2xl shadow p-4 flex gap-4 items-start"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {ch.title.split(" ")[0]}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-100">{ch.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{ch.desc}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      Reward:{" "}
                      <span className="font-medium text-gray-100">{ch.reward} XP</span>
                    </span>
                    <span>•</span>
                    <span>Est: {ch.estTime}</span>
                  </div>
                </div>

                <div className="w-36 text-right">
                  <button
                    onClick={() => {
                      setSelectedId(ch.id);
                      // navigate(`/challenges/${ch.id}`) if you make detail page
                    }}
                    className="mb-2 block w-full px-3 py-2 rounded-lg border border-white/6 bg-white/4 text-gray-100 hover:bg-white/6 transition"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => toggleComplete(ch.id)}
                    className={`block w-full px-3 py-2 rounded-lg transition ${
                      completed[ch.id]
                        ? "bg-emerald-500 text-white"
                        : "bg-white/6 border border-white/6 text-gray-100"
                    }`}
                  >
                    {completed[ch.id] ? "Completed" : "Mark Complete"}
                  </button>
                </div>
              </div>

              {/* Expanded detail (optional) */}
              {selectedId === ch.id && (
                <div className="mt-3 bg-gray-900/50 rounded-lg p-3 border border-white/6">
                  <p className="text-sm text-gray-300">Tips:</p>
                  <ul className="text-sm text-gray-400 list-disc ml-5 mt-2">
                    <li>Plan your 3-part series before creating content.</li>
                    <li>Mix formats: story + images + short video.</li>
                    <li>Use AI tools to draft storylines and edit visuals.</li>
                  </ul>

                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white">
                      Use AI Model
                    </button>
                    <button className="px-3 py-2 rounded-lg border border-white/6 text-gray-100">
                      Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}

        {/* Weekly Summary */}
        <div className="bg-nav_hover border border-nav_hover3 rounded-2xl shadow p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Weekly progress</h3>
            <p className="text-sm text-gray-400">
              Complete all weekly challenges to unlock special achievements.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Weekly completion</div>
            <div className="text-2xl font-bold text-gray-100">
              {Object.keys(completed).filter((k) => completed[k]).length}/
              {weeklyChallengesData?.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
