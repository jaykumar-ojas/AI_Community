import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Svg from "./svg";
import Svg2 from "./Svg2";



const Register = () => {
  const history = useNavigate();
  const [show, setShow] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [inpVal, setInpVal] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const validateForm = () => {
    const { userName, email, password, confirmPassword ,otp} = inpVal;
    if (!userName) return "Username is required.";
    if (!email) return "Email is required.";
    if (!password) return "Password is required.";
    if (!confirmPassword) return "Confirm Password is required.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if(otp.length!==4) return "otp is required";
    return null;
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setShowOtp(true);
    const { email } = inpVal;
    const data = await fetch("/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });
    const res = await data.json();
    if (res.status === 200) {
      alert("otp sent successfully");
    } else {
      alert("email is required");
    }
  };

  const addUserData = async (e) => {
    e.preventDefault();
    const errorMessage = validateForm();
    if (errorMessage) {
      alert(errorMessage);
      return;
    }
    const { userName, email, password, confirmPassword, otp } = inpVal;

    if (userName === "") {
      alert("userName required");
    }
    else {
      console.log("going for post");
      const data = await fetch("http://localhost:8099/register", {
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
      console.log("coming for post");
      const res = await data.json();
      console.log(res.status);
      if (data.status === 201) {
        alert("user registration done");
        setInpVal({
          ...inpVal,
          userName: "",
          email: "",
          password: "",
          confirmPassword: "",
          otp: "",
        });
        localStorage.setItem("userdatatoken", res.token);
        history("/");
      } else {
        console.log(res.error);
      }
    }
  };

  const setVal = (e) => {
    // console.log(e.target.value);
    const { name, value } = e.target;

    setInpVal(() => {
      return {
        ...inpVal,
        [name]: value,
      };
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
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
              <div className="w-full max-w-xs mb-3">
                <label
                  className="mb-1 block text-sm font-bold"
                  htmlFor="userName"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={inpVal.userName}
                  onChange={setVal}
                  className="w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500"
                  placeholder="@Leonardo_Monalisa"
                />
              </div>
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
                  className="w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500"
                  placeholder="mail@user.com"
                />
              </div>
              <div className="w-full max-w-xs mb-3">
                <label
                  className="mb-1 block text-sm font-bold"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="password"
                    name="password"
                    onChange={setVal}
                    value={inpVal.password}
                    className="w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your password"
                  />
                  <div
                    className="absolute inset-y-0 right-2 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {!show ? <Svg2 /> : <Svg />}
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs mb-3">
                <label
                  className="mb-1 block text-sm font-bold"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    onChange={setVal}
                    value={inpVal.confirmPassword}
                    className="w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Confirm your password"
                  />
                  <div
                    className="absolute inset-y-0 right-2 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {!show ? <Svg2 /> : <Svg />}
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs mb-4">
                {showOtp && (
                  <div>
                    <label
                      className="mb-1 block text-sm font-bold"
                      htmlFor="otp"
                    >
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      onChange={setVal}
                      value={inpVal.otp}
                      className="w-full max-w-xs rounded-full bg-white p-3 text-sm text-black placeholder-indigo-900 shadow placeholder:opacity-30 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your OTP"
                    />
                  </div>
                )}
                <button
                  onClick={sendOtp}
                  className="text-xs text-red-600 underline w-full text-right"
                >
                  Verify Email
                </button>
              </div>
              <div className="w-full max-w-xs">
                <button
                  className={`w-full rounded-full bg-orange-600 py-2 text-sm font-bold text-white hover:bg-orange-800 ${
                    validateForm()? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={addUserData}
                  disabled={validateForm()} // Disable the button if showOtp is false
                >
                  Register
                </button>
                <div className="mt-2 text-center text-sm">
                  <span>
                    Already a member?{" "}
                    <Link
                      to="/login"
                      className="text-orange-500 hover:underline"
                    >
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
