import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Svg from "./svg";
import Svg2 from "./Svg2";

const Register = () => {
  const history = useNavigate();
  const [show, setShow] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [inpVal, setInpVal] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [popupType, setPopupType] = useState("error");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (name, value) => {
    switch (name) {
      case "userName":
        return !value.trim() ? "Username is required" : "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!validateEmail(value)) return "Please enter a valid email";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      case "confirmPassword":
        if (!value) return "Confirm password is required";
        if (value !== inpVal.password) return "Passwords do not match";
        return "";
      case "otp":
        if (isOtpSent && !isOtpVerified) {
          if (!value) return "OTP is required";
          if (value.length !== 4) return "OTP must be 4 digits";
        }
        return "";
      default:
        return "";
    }
  };

  const canSendOtp = () => {
    const { userName, email, password, confirmPassword } = inpVal;
    return (
      userName.trim() &&
      validateEmail(email) &&
      password.length >= 8 &&
      confirmPassword &&
      password === confirmPassword &&
      !isOtpSent
    );
  };

  const canRegister = () => {
    const { userName, email, password, confirmPassword, otp } = inpVal;
    return (
      userName.trim() &&
      validateEmail(email) &&
      password.length >= 8 &&
      confirmPassword &&
      password === confirmPassword &&
      isOtpVerified &&
      otp.length === 4
    );
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    
    if (!canSendOtp()) {
      setPopupType("error");
      setErrorMessage("Please fill all fields correctly before verifying email");
      return;
    }

    const { email } = inpVal;
    setIsLoading(true);
    
    try {
      const data = await fetch("/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const res = await data.json();
      
      if (res.status === 200) {
        setIsOtpSent(true);
        setPopupType("success");
        setErrorMessage("OTP sent successfully to your email");
      } else if (res.status === 409) {
        // User already exists
        setPopupType("error");
        setErrorMessage(res.message || "User already exists. Please login instead.");
        // Optionally redirect to login after a delay
        setTimeout(() => {
          history("/login");
        }, 3000);
      } else {
        setPopupType("error");
        setErrorMessage(res.message || res.error || "Failed to send OTP");
      }
    } catch (err) {
      setPopupType("error");
      setErrorMessage("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp) => {
    if (otp.length !== 4) return;
    
    setIsLoading(true);
    try {
      const data = await fetch("/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inpVal.email,
          enteredOtp: otp,
        }),
      });
      const res = await data.json();
      
      if (res.status === 200) {
        setIsOtpVerified(true);
        setPopupType("success");
        setErrorMessage("Email verified successfully");
        setFieldErrors(prev => ({ ...prev, otp: "" }));
      } else {
        setPopupType("error");
        setErrorMessage(res.message || "Invalid OTP");
        setFieldErrors(prev => ({ ...prev, otp: "Invalid OTP" }));
      }
    } catch (err) {
      setPopupType("error");
      setErrorMessage("OTP verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addUserData = async (e) => {
    e.preventDefault();
    
    if (!canRegister()) {
      setPopupType("error");
      setErrorMessage("Please complete all steps before registering");
      return;
    }

    const { userName, email, password, confirmPassword, otp } = inpVal;
    setIsLoading(true);
    
    try {
      const data = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          email,
          password,
          confirmPassword,
          otp,
        }),
      });
      const res = await data.json();
      
      if (data.status === 201) {
        setInpVal({
          userName: "",
          email: "",
          password: "",
          confirmPassword: "",
          otp: "",
        });
        localStorage.setItem("userdatatoken", res.token);
        setPopupType("success");
        setErrorMessage("Registration successful!");
        setTimeout(() => {
          setErrorMessage("");
          history("/");
        }, 1500);
      } else {
        setPopupType("error");
        setErrorMessage(res.message || res.error || "Registration failed");
      }
    } catch (err) {
      setPopupType("error");
      setErrorMessage("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const setVal = (e) => {
    const { name, value } = e.target;
    
    setInpVal(prev => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error,
    }));

    // Special handling for confirmPassword when password changes
    if (name === "password" && inpVal.confirmPassword) {
      const confirmError = validateField("confirmPassword", inpVal.confirmPassword);
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }

    // Auto-verify OTP when 4 digits are entered
    if (name === "otp" && value.length === 4 && isOtpSent && !isOtpVerified) {
      verifyOtp(value);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Popup */}
      {errorMessage && (
        <div
          className={`fixed top-4 left-1/2 z-50 transform -translate-x-1/2 px-6 py-4 rounded shadow-lg flex items-center gap-2
            ${popupType === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-white border border-red-400 text-red-700"}
          `}
        >
          <span>{errorMessage}</span>
        </div>
      )}
      
      {/* Left Section */}
      <div className="flex flex-grow bg-black text-white md:w-1/2">
        <div className="mx-auto flex w-4/5 max-w-md flex-col justify-center items-center">
          <div className="text-center mb-6">
            <p className="text-2xl font-bold mb-2">Welcome to PixxelMind</p>
            <p className="text-sm text-gray-300">
              Register to join our community
            </p>
          </div>
          
          <div className="w-full">
            <form className="flex flex-col items-center">
              {/* Username Field */}
              <div className="w-full max-w-xs mb-3">
                <label className="mb-1 block text-sm font-bold" htmlFor="userName">
                  Username
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={inpVal.userName}
                  onChange={setVal}
                  className={`w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.userName ? "border-2 border-red-500" : ""
                  }`}
                  placeholder="@Leonardo_Monalisa"
                  disabled={isLoading}
                />
                {fieldErrors.userName && (
                  <div className="text-red-500 text-xs mt-1">{fieldErrors.userName}</div>
                )}
              </div>

              {/* Email Field */}
              <div className="w-full max-w-xs mb-3">
                <label className="mb-1 block text-sm font-bold" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={inpVal.email}
                  onChange={setVal}
                  className={`w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.email ? "border-2 border-red-500" : ""
                  }`}
                  placeholder="mail@user.com"
                  disabled={isLoading || isOtpSent}
                />
                {fieldErrors.email && (
                  <div className="text-red-500 text-xs mt-1">{fieldErrors.email}</div>
                )}
              </div>

              {/* Password Field */}
              <div className="w-full max-w-xs mb-3">
                <label className="mb-1 block text-sm font-bold" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="password"
                    name="password"
                    onChange={setVal}
                    value={inpVal.password}
                    className={`w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.password ? "border-2 border-red-500" : ""
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading || isOtpSent}
                  />
                  <div
                    className="absolute inset-y-0 right-2 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {!show ? <Svg2 /> : <Svg />}
                  </div>
                </div>
                {fieldErrors.password && (
                  <div className="text-red-500 text-xs mt-1">{fieldErrors.password}</div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="w-full max-w-xs mb-3">
                <label className="mb-1 block text-sm font-bold" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    onChange={setVal}
                    value={inpVal.confirmPassword}
                    className={`w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.confirmPassword ? "border-2 border-red-500" : ""
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading || isOtpSent}
                  />
                  <div
                    className="absolute inset-y-0 right-2 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {!show ? <Svg2 /> : <Svg />}
                  </div>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</div>
                )}
              </div>

              {/* OTP Field - Only shown after email verification */}
              {isOtpSent && (
                <div className="w-full max-w-xs mb-3">
                  <label className="mb-1 block text-sm font-bold" htmlFor="otp">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    onChange={setVal}
                    value={inpVal.otp}
                    maxLength="4"
                    className={`w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.otp ? "border-2 border-red-500" : ""
                    } ${isOtpVerified ? "border-2 border-green-500" : ""}`}
                    placeholder="Enter 4-digit OTP"
                    disabled={isLoading || isOtpVerified}
                  />
                  {fieldErrors.otp && (
                    <div className="text-red-500 text-xs mt-1">{fieldErrors.otp}</div>
                  )}
                  {isOtpVerified && (
                    <div className="text-green-500 text-xs mt-1">✓ Email verified successfully</div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full max-w-xs">
                {!isOtpSent ? (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className={`w-full rounded-full py-2 text-sm font-bold text-white mb-2 ${
                      canSendOtp()
                        ? "bg-blue-600 hover:bg-blue-800"
                        : "bg-gray-500 cursor-not-allowed opacity-50"
                    }`}
                    disabled={!canSendOtp() || isLoading}
                  >
                    {isLoading ? "Sending OTP..." : "Verify Email"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={addUserData}
                    className={`w-full rounded-full py-2 text-sm font-bold text-white mb-2 ${
                      canRegister()
                        ? "bg-orange-600 hover:bg-orange-800"
                        : "bg-gray-500 cursor-not-allowed opacity-50"
                    }`}
                    disabled={!canRegister() || isLoading}
                  >
                    {isLoading ? "Registering..." : "Register"}
                  </button>
                )}
                
                <div className="mt-2 text-center text-sm">
                  <span>
                    Already a member?{" "}
                    <Link to="/login" className="text-orange-500 hover:underline">
                      Login
                    </Link>
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="hidden h-full w-full bg-blue-600 md:block md:w-1/2">
        <img
          src="https://images.pexels.com/photos/2523959/pexels-photo-2523959.jpeg"
          className="h-full w-full object-cover"
          alt="Login Illustration"
        />
      </div>
    </div>
  );
};

export default Register;