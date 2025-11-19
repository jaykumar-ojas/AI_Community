import React, { useState } from "react";
import axios from "axios";
import { getAuthHeaders } from "../AiForumPage/components/ForumUtils";

const baseUrl = process.env.REACT_APP_BASE_URL;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: "" });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    // Clear status message when user starts typing
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      setSubmitStatus({ 
        type: "error", 
        message: "Please fill in the title and description fields." 
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const headers = getAuthHeaders();
      const token = localStorage.getItem("userdatatoken");
      
      // Include token in Authorization header if available
      if (token) {
        headers['Authorization'] = token;
      }

      const response = await axios.post(
        `${baseUrl}/feedback/submit`,
        formData,
        { 
          headers,
          withCredentials: true 
        }
      );

      if (response.data.status === 201) {
        setSubmitStatus({ 
          type: "success", 
          message: "Thank you! Your feedback has been submitted successfully." 
        });
        
        // Reset form
        setFormData({
          category: "Bug",
          title: "",
          priority: "Low",
          description: "",
          steps: "",
          email: "",
          anonymous: false,
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: "" });
        }, 5000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitStatus({ 
        type: "error", 
        message: error.response?.data?.error || "Failed to submit feedback. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-bg_dark min-h-screen p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left column: form */}
        <div className="lg:col-span-2">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl font-bold dark:text-theme_color">PixxelMind — Feedback & Bug Report</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-low_text mt-1">
              Share bugs, request features, or suggest improvements.
            </p>
          </div>

          {/* Status Message */}
          {submitStatus.type && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                submitStatus.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                  : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
              }`}
            >
              {submitStatus.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white dark:bg-bg_dark p-4 sm:p-6 rounded-2xl shadow"
          >
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg text-sm dark:bg-nav_hover dark:border-gray-700 dark:text-white"
              >
                <option className="dark:bg-nav_hover dark:text-white">Bug</option>
                <option className="dark:bg-nav_hover dark:text-white">Feature Request</option>
                <option className="dark:bg-nav_hover dark:text-white">Suggestion</option>
                <option className="dark:bg-nav_hover dark:text-white">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Short title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Summarize the issue or idea"
                  className="w-full p-3 border rounded-lg text-sm dark:bg-nav_hover dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Severity / Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-sm dark:bg-nav_hover dark:border-gray-700 dark:text-white"
                >
                  <option className="dark:bg-nav_hover dark:text-white">Low</option>
                  <option className="dark:bg-nav_hover dark:text-white">Medium</option>
                  <option className="dark:bg-nav_hover dark:text-white">High</option>
                  <option className="dark:bg-nav_hover dark:text-white">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe what happened..."
                className="w-full p-3 border rounded-lg text-sm dark:bg-nav_hover dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Steps to reproduce (optional)
              </label>
              <textarea
                name="steps"
                value={formData.steps}
                onChange={handleChange}
                rows="4"
                placeholder="1. Go to X..."
                className="w-full p-3 border rounded-lg text-sm dark:bg-nav_hover dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Attachments</label>
              <input type="file" multiple className="block text-sm dark:text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Contact email (optional)
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  type="email"
                  className="w-full p-3 border rounded-lg text-sm dark:bg-nav_hover dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
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
                <label htmlFor="anonymous" className="text-sm dark:text-white">
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
                className="px-4 py-2 rounded-lg border text-sm w-full sm:w-auto dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-lg text-white text-sm w-full sm:w-auto ${
                  isSubmitting
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <strong className="dark:text-white">Tips:</strong> Add reproduction steps and attachments for bugs.
            For feature requests, explain the use-case.
          </div>
        </div>

        {/* Right column: info */}
        <aside className="order-first lg:order-none">
          <div className="bg-white dark:bg-bg_dark p-4 sm:p-6 rounded-2xl shadow space-y-4">
            <h3 className="text-sm font-semibold dark:text-theme_color">Help us improve</h3>
            <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-low_text">
              <p>
                Your feedback helps us build a better platform. Whether you've found a bug, 
                have a feature idea, or just want to share your thoughts, we'd love to hear from you!
              </p>
              <div className="mt-4 space-y-2">
                <p className="font-semibold dark:text-theme_color">Tips for submitting feedback:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Be specific and descriptive</li>
                  <li>Include steps to reproduce for bugs</li>
                  <li>Explain the use-case for feature requests</li>
                  <li>Attach screenshots if relevant</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default FeedbackPage;



