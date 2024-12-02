import React, { useState } from "react";
import { Link } from "react-router-dom";

const Register = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* Left Section */}
      <div className="flex flex-grow bg-black text-white md:w-1/2">
        <div className="mx-auto flex w-4/5 max-w-md flex-col justify-center items-center">
          <div className="text-center mb-8">
            <p className="text-4xl font-bold mb-2">Welcome to PixxelMind</p>
            <p className="text-lg text-gray-300">Register to join our community</p>
          </div>
          <div className="w-full">
            <form className="flex flex-col items-center">
              <div className="w-full max-w-xs mb-4">
                <label className="mb-2 block font-extrabold" htmlFor="userName">
                  Username
                </label>
                <input
                  type="text"
                  id="userName"
                  className="w-full rounded-full bg-white p-3 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                  placeholder="@Leonardo_Monalisa"
                />
              </div>
              <div className="w-full max-w-xs mb-4">
                <label className="mb-2 block font-extrabold" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full rounded-full bg-white p-3 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                  placeholder="mail@user.com"
                />
              </div>
              <div className="w-full max-w-xs mb-4">
                <label className="mb-2 block font-extrabold" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="password"
                    className="w-full rounded-full bg-white p-3 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                    placeholder="Enter your password"
                  />
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {/* SVG for visibility toggle */}
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs mb-6">
                <label className="mb-2 block font-extrabold" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="confirmPassword"
                    className="w-full rounded-full bg-white p-3 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                    placeholder="Confirm your password"
                  />
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {/* SVG for visibility toggle */}
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs">
                <button className="w-full rounded-full bg-orange-600 py-3 font-bold text-white hover:bg-orange-800">
                  Register
                </button>
                <div className="mt-4 text-center">
                  <span>Already a member? <Link to="/login" className="text-orange-500 hover:underline">Login</Link></span>
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
