import React, { useState } from "react";
const baseUrl = process.env.REACT_APP_BASE_URL;


/**
 * CreateChallenge.jsx
 * - Tailwind required
 * - POSTs to /api/challenges (change if needed)
 * - Keeps a small client-side validation
 */

export default function CreateChallenge() {
  const [type, setType] = useState("daily");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardXP, setRewardXP] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [date, setDate] = useState(""); // for daily
  const [weekStart, setWeekStart] = useState(""); // for weekly -> ISO date of week start
  const [formats, setFormats] = useState({ image: false, video: false, text: true });
  const [extraTips, setExtraTips] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function toggleFormat(key) {
    setFormats(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function updateTip(index, value) {
    setExtraTips(prev => prev.map((t, i) => (i === index ? value : t)));
  }
  function addTip() {
    setExtraTips(prev => [...prev, ""]);
  }
  function removeTip(index) {
    setExtraTips(prev => prev.filter((_, i) => i !== index));
  }

  function validate() {
    if (!title.trim()) return "Title is required";
    if (!description.trim()) return "Description is required";
    if (type === "daily" && !date) return "Select a date for daily challenge";
    if (type === "weekly" && !weekStart) return "Select week start date for weekly challenge";
    if (rewardXP < 0) return "Reward XP must be >= 0";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }

    const payload = {
      type,
      title,
      description,
      rewardXP: Number(rewardXP),
      estimatedTime,
      date: type === "daily" ? date : undefined,
      weekStart: type === "weekly" ? weekStart : undefined,
      formats,
      extraTips: extraTips.filter(t => t.trim() !== ""),
    };

    try {
      console.log("i m going");
      setLoading(true);
      const res = await fetch(`${baseUrl}/challenges/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create challenge");
      // success
      setMessage({ type: "success", text: "Challenge created successfully" });
      // reset form (optional)
      setTitle("");
      setDescription("");
      setRewardXP(0);
      setEstimatedTime("");
      setDate("");
      setWeekStart("");
      setFormats({ image: false, video: false, text: true });
      setExtraTips([""]);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Server error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 text-gray-100 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Create Challenge</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <label className={`px-3 py-2 rounded-lg cursor-pointer ${type==='daily' ? 'bg-indigo-600 text-white' : 'bg-white/6 text-gray-100'}`}>
            <input className="hidden" type="radio" name="type" value="daily" checked={type==='daily'} onChange={() => setType("daily")} />
            Daily
          </label>
          <label className={`px-3 py-2 rounded-lg cursor-pointer ${type==='weekly' ? 'bg-indigo-600 text-white' : 'bg-white/6 text-gray-100'}`}>
            <input className="hidden" type="radio" name="type" value="weekly" checked={type==='weekly'} onChange={() => setType("weekly")} />
            Weekly
          </label>
        </div>

        <div>
          <label className="block text-sm text-gray-300">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-white/6 rounded" placeholder="e.g. Digital Samurai" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full mt-1 p-2 bg-gray-800 border border-white/6 rounded" placeholder="Challenge description..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300">Reward XP</label>
            <input type="number" value={rewardXP} onChange={e => setRewardXP(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-white/6 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-300">Estimated time (e.g. 5–10 min)</label>
            <input value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-white/6 rounded" />
          </div>
        </div>

        {/* Date pickers */}
        {type === "daily" ? (
          <div>
            <label className="block text-sm text-gray-300">Challenge Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 p-2 bg-gray-800 border border-white/6 rounded" />
          </div>
        ) : (
          <div>
            <label className="block text-sm text-gray-300">Week Start (pick the Monday or week start)</label>
            <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="mt-1 p-2 bg-gray-800 border border-white/6 rounded" />
            <p className="text-xs text-gray-500 mt-1">This will be used as the `weekStart` for weekly challenges.</p>
          </div>
        )}

        {/* Formats */}
        <div>
          <div className="text-sm text-gray-300 mb-2">Formats</div>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={formats.image} onChange={() => toggleFormat("image")} />
              <span className="text-sm">Image</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={formats.video} onChange={() => toggleFormat("video")} />
              <span className="text-sm">Video</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={formats.text} onChange={() => toggleFormat("text")} />
              <span className="text-sm">Text</span>
            </label>
          </div>
        </div>

        {/* Tips */}
        <div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">Extra Tips</div>
            <button type="button" onClick={addTip} className="text-sm text-indigo-400">+ Add tip</button>
          </div>

          <div className="mt-2 space-y-2">
            {extraTips.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input value={t} onChange={e => updateTip(i, e.target.value)} className="flex-1 p-2 bg-gray-800 border border-white/6 rounded" placeholder={`Tip #${i+1}`} />
                <button type="button" onClick={() => removeTip(i)} className="px-3 rounded bg-white/6">Del</button>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={`p-2 rounded ${message.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white">
            {loading ? "Creating..." : "Create Challenge"}
          </button>
          <button type="button" onClick={() => {
            // quick preview
            setMessage({ type: "success", text: `Preview: ${title || "(no title)"} — ${type === "daily" ? date : weekStart}` });
          }} className="px-4 py-2 rounded bg-white/6 text-gray-100">Preview</button>
        </div>
      </form>
    </div>
  );
}
