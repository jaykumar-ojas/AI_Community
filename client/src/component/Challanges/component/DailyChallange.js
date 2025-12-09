// DailyChallenges.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { getAuthHeaders, handleAuthError } from "../../AiForumPage/components/ForumUtils";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { LoginContext } from "../../ContextProvider/context";
const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:8099";

function todayIso() {
  return new Date().toISOString().split("T")[0];
}


const BlueTick = ({ height = 32 }) => {
  return (
    <svg
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L15.09 5.26L19.18 5.27L20.45 9.12L23.64 11.43L22.65 15.42L24 19L20.45 20.88L19.18 24.73L15.09 23.74L12 27L8.91 23.74L4.82 24.73L3.55 20.88L0 19L1.35 15.42L0.36 11.43L3.55 9.12L4.82 5.27L8.91 5.26L12 2Z"
        fill="#3ae95dff"
      />
      <path
        d="M10.5 14.5L8 12L7 13L10.5 16.5L17 10L16 9L10.5 14.5Z"
        fill="white"
      />
    </svg>
  );
};


function formatPrettyDate(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);

  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  if (isToday) return "Today";

  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" }); // Jan, Feb, Mar...
  const year = d.getFullYear().toString().slice(2); // 24, 25

  return `${day} ${month}, ${year}`;
}

export default function DailyChallenges() {
  const {loginData} = useContext(LoginContext);
  const { completed, toggleComplete, setSelectedId } = useOutletContext();
  const navigate = useNavigate();
  const [err, setErr] = useState(null);

  // selectedDate controls which day's challenges are fetched
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const userId =
  loginData?.validuserone?._id || loginData?.validateUser?._id;

function isCompleted(ch) {
  return (ch?.completedBy || []).some(
    (u) => String(u?._id ?? u) === String(userId)
  );
}

  async function fetchDaily(date = selectedDate) {
    console.log("fetchDaily for date:", date);

    const res = await fetch(`${baseUrl}/challenges/daily?date=${date}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) throw new Error(data?.message || "Failed to load challenges");

    return data?.challenges ?? [];
  }

  const {
    data: challenges = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["challenges", selectedDate],
    queryFn: () => fetchDaily(selectedDate),
    staleTime: 1000 * 60 * 5,
    retry: false,
    onError: (err) => {
      if (handleAuthError(err)) return;
      console.error("Error fetching daily challenges:", err);
    },
  });

  console.log(challenges);

  // If you want to programmatically refetch when selectedDate changes, react-query already does it
  // because selectedDate is in the queryKey. But if you want an explicit refetch:
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Challenges</h1>
          <p className="text-sm text-gray-400">
            Complete challenges to earn XP, badges and leaderboard points.
          </p>
        </div>

        {/* Right side: date picker */}
        <div className="flex items-center gap-3 relative">
  {/* Pretty formatted text */}
  <span className="text-low_text text-sm">
    {formatPrettyDate(selectedDate)}
  </span>

  {/* Hidden date input */}
  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    max={todayIso()}
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    style={{ zIndex: 20 }}
  />

  {/* Calendar button (visible) */}
  <button
    type="button"
    className="text-low_text cursor-pointer"
    onClick={() => {
      // trigger click on hidden input
      document.querySelector("#hidden-date-picker")?.showPicker?.();
    }}
  >
    <Calendar size={18} />
  </button>

  {/* Actual hidden input that showPicker will trigger */}
  <input
    id="hidden-date-picker"
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    max={todayIso()}
    className="hidden"
  />
</div>

      </div>

      {isLoading && <div className="text-gray-400">Loading daily challenges...</div>}

      {error && (
        <div className="text-red-400 bg-red-400/10 p-2 rounded">
          {error?.message || "sorry failed to challange"}
        </div>
      )}

      {!isLoading && challenges?.length === 0 && !error && (
        <div className="text-gray-400 italic">No challenge found for this date.</div>
      )}

      <div className="space-y-4">
        {challenges?.map((ch) => (
          <article
            key={ch?._id}
            onClick={() => navigate(`/challenges/daily/${ch?._id}`)}
            className="bg-nav_hover border border-nav_hover3 rounded-2xl shadow p-4 flex gap-4 items-start cursor-pointer"
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
                      <span className="font-medium text-gray-100"> {ch?.rewardXP} XP</span>
                    </span>
                    <span>•</span>
                    <span>Est: {ch?.estimatedTime}</span>
                  </div>
                </div>
                 {isCompleted(ch) && <div><BlueTick/></div>}
              </div>
             
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
