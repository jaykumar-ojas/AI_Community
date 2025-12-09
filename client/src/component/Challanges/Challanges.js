// ChallengesLayout.jsx
import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

export default function ChallengesLayout() {
  const [completed, setCompleted] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  function toggleComplete(id) {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="text-low_text h-[calc(100vh-4rem)]">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-[20%] h-[calc(100vh-4rem)] sticky rounded-2xl shadow-lg border border-transparent/20 backdrop-blur-sm bg-nav_hover bg-opacity-30 p-4">
          <div className="flex items-center bg-nav_hover2 py-3 rounded-xl mb-4">
            <div className="text-xl px-4 text-theme_color font-bold">Challenges • Rewards</div>
          </div>

          <nav className="space-y-2">
            <NavLink
              to="/challenges/daily"
              className={({ isActive }) =>
                `w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition ${isActive ? "bg-white/5" : "hover:bg-white/3"}`
              }
            >
              <span className={`inline-block w-2 h-2 rounded-full`} />
              <span className="font-medium text-gray-100">Daily Challenges</span>
            </NavLink>

            <NavLink
              to="/challenges/weekly"
              className={({ isActive }) =>
                `w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition ${isActive ? "bg-white/5" : "hover:bg-white/3"}`
              }
            >
              <span className={`inline-block w-2 h-2 rounded-full`} />
              <span className="font-medium text-gray-100">Weekly Challenges</span>
            </NavLink>

            <NavLink to="/challenges/progress" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300">My Progress</NavLink>
            <NavLink to="/challenges/badges" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300">Badges</NavLink>
            <NavLink to="/challenges/settings" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300">Settings</NavLink>
            <NavLink to="/challenges/create" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300">create</NavLink>

          </nav>

          <div className="mt-auto absolute bottom-4 left-4 right-4 text-sm text-gray-400">
            <p className="mb-2">Streak: <span className="font-semibold text-gray-100">6 days</span></p>
            <div className="w-full bg-white/6 rounded-full h-2 overflow-hidden mb-2">
              <div className="h-2 rounded-full" style={{ width: "60%", background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }} />
            </div>
            <p>XP: <span className="font-semibold text-gray-100">1,240</span></p>
          </div>
        </aside>

        {/* Main content area that changes by route */}
        <main className="flex-1 h-[calc(100vh-4.1rem)] overflow-y-auto">
          {/* pass shared state via outlet context */}
          <Outlet context={{ completed, toggleComplete, selectedId, setSelectedId }} />
        </main>

        {/* Right column */}
        <aside className="w-[25%] flex flex-col gap-2">
          <div className="bg-nav_hover border border-nav_hover2 rounded-2xl shadow-sm p-4 border border-white/6">
            <h3 className="font-semibold text-gray-100 mb-3">Leaderboard</h3>
            <p className="text-xs text-gray-400 mb-4">Top creators — dynamic view</p>

            <ol className="space-y-3">
              {[
                { id: 1, name: "Anya", points: 1540 },
                { id: 2, name: "Riz", points: 1320 },
                { id: 3, name: "Kav", points: 980 },
                { id: 4, name: "Jay", points: 760 },
                { id: 5, name: "Maya", points: 520 },
              ].map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/6 flex items-center justify-center font-semibold text-gray-100">
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-100">{p.name}</div>
                      <div className="text-xs text-gray-400">Points: {p.points}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-300">#{p.id}</div>
                </li>
              ))}
            </ol>

            <div className="mt-4">
              <button className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-500 text-white">View full leaderboard</button>
            </div>
          </div>

          <div className="mt-4 bg-nav_hover rounded-2xl shadow-sm p-4 text-sm border border-nav_hover2">
            <div className="font-semibold text-gray-100">Weekly Spotlight</div>
            <p className="text-gray-400 mt-2">Feature your winning post here.</p>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded-lg border border-white/6 text-gray-100">How it works</button>
              <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white">Participate</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
