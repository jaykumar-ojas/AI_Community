import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inpval, setInpVal] = useState({
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("error"); // 'success' or 'error'
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (popupMessage) {
      const timer = setTimeout(() => setPopupMessage("") , 5000);
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInpVal((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "password") {
      if (value.length > 0 && value.length < 8) {
        setPasswordError("Password must be at least 8 characters.");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = inpval;

    if (!acceptTerms) {
      setError("You must accept the Terms and Conditions.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8099/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: id,
        },
        body: JSON.stringify({ password,confirmPassword }),
      });
      const res = await response.json();

      if (res.status === 200) {
        setPopupType("success");
        setPopupMessage("Password updated successfully");
        setTimeout(() => {
          setPopupMessage("");
          navigate("/login");
        }, 1500);
      } else {
        setPopupType("error");
        setPopupMessage(res.error || "Failed to update password");
      }
    } catch (err) {
      setPopupType("error");
      setPopupMessage(err.message || "Failed to update password");
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      {/* Popup */}
      {popupMessage && (
        <div
          className={`fixed top-4 left-1/2 z-50 transform -translate-x-1/2 px-6 py-4 rounded shadow-lg flex items-center gap-2
            ${popupType === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-white border border-red-400 text-red-700"}
          `}
        >
          <span>{popupMessage}</span>
        </div>
      )}
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow dark:border dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Change Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              New Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={inpval.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            {passwordError && (
              <div className="text-red-500 text-xs mt-1">{passwordError}</div>
            )}
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirm-password"
              value={inpval.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          <div className="flex items-start">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-500 dark:ring-offset-gray-800"
            />
            <label
              htmlFor="accept-terms"
              className="ml-2 text-sm text-gray-500 dark:text-gray-300"
            >
              I accept the{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                Terms and Conditions
              </a>
            </label>
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Reset Password
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChangePassword;
