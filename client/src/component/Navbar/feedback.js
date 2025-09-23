import React, { useState } from "react";

const FeedbackPage=()=>{
  const [formData, setFormData] = useState({
    category: "Bug",
    title: "",
    priority: "Low",
    description: "",
    steps: "",
    email: "",
    anonymous: false,
  });

  const recentReports = [
    {
      title: "Login button unresponsive on mobile",
      type: "Bug",
      priority: "High",
      date: "2025-09-20",
      tags: ["mobile", "auth"],
    },
    {
      title: "Add dark mode option",
      type: "Feature Request",
      priority: "Low",
      date: "2025-09-10",
      tags: ["ux"],
    },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Feedback:", formData);
    alert("Feedback submitted (check console)");
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left column: form */}
        <div className="lg:col-span-2">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl font-bold">PixxelMind — Feedback & Bug Report</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Share bugs, request features, or suggest improvements.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg text-sm"
              >
                <option>Bug</option>
                <option>Feature Request</option>
                <option>Suggestion</option>
                <option>Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Short title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Summarize the issue or idea"
                  className="w-full p-3 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Severity / Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe what happened..."
                className="w-full p-3 border rounded-lg text-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Steps to reproduce (optional)
              </label>
              <textarea
                name="steps"
                value={formData.steps}
                onChange={handleChange}
                rows="4"
                placeholder="1. Go to X..."
                className="w-full p-3 border rounded-lg text-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attachments</label>
              <input type="file" multiple className="block text-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact email (optional)
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="w-full p-3 border rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center gap-2 mt-2 md:mt-6">
                <input
                  id="anonymous"
                  name="anonymous"
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label htmlFor="anonymous" className="text-sm">
                  Post anonymously
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="reset"
                onClick={() =>
                  setFormData({
                    category: "Bug",
                    title: "",
                    priority: "Low",
                    description: "",
                    steps: "",
                    email: "",
                    anonymous: false,
                  })
                }
                className="px-4 py-2 rounded-lg border text-sm w-full sm:w-auto"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm w-full sm:w-auto"
              >
                Submit feedback
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs sm:text-sm text-gray-600">
            <strong>Tips:</strong> Add reproduction steps and attachments for bugs.
            For feature requests, explain the use-case.
          </div>
        </div>

        {/* Right column: recent reports */}
        <aside className="order-first lg:order-none">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow space-y-4">
            <h3 className="text-sm font-semibold">Recent reports</h3>
            <div className="mt-3 space-y-3 text-sm">
              {recentReports.map((report, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg bg-gray-50"
                >
                  <div className="font-semibold text-sm sm:text-base">{report.title}</div>
                  <div className="text-xs text-gray-500">
                    {report.type} • {report.priority} • {report.date}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {report.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-white rounded-full border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default FeedbackPage;
