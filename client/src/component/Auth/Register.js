import React, { useState } from "react";
import { Link } from "react-router-dom"; // Removed 'Links'

const Register = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* Left Section */}
      <div className="flex flex-grow bg-black text-white md:w-1/2">
        <div className="mx-auto flex w-4/5 max-w-md flex-col justify-center">
          <div>
            <p className="text-2xl font-bold">Welcome to PixxelMind</p>
            <p className="text-sm">Register at PM</p>
          </div>
          <div className="mt-6">
            <form className="flex flex-col items-center">
              <div className="w-full max-w-xs">
                <label className="mb-2.5 block font-extrabold" htmlFor="email">
                  UserName
                </label>
                <input
                  type="text"
                  id="userName"
                  className="w-full rounded-full bg-white p-2.5 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                  placeholder="@Leanardo_Monalisa"
                />
              </div>
              <div className="w-full max-w-xs">
                <label className="mb-2.5 block font-extrabold" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full rounded-full bg-white p-2.5 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                  placeholder="mail@user.com"
                />
              </div>
              <div className="mt-4 w-full max-w-xs">
                <label className="mb-2.5 block font-extrabold" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="password"
                    className="w-full rounded-full bg-white p-2.5 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
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
              <div className="mt-4 w-full max-w-xs">
                <label className="mb-2.5 block font-extrabold" htmlFor="password">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="confirmPassword"
                    className="w-full rounded-full bg-white p-2.5 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
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
              <div className="my-6 w-full max-w-xs">
                <button className="w-full rounded-full bg-orange-600 p-4 hover:bg-orange-800">
                  Register
                </button>
                <div className="mt-4 flex w-full max-w-xs justify-between">
                  <span>Already a member?</span>
                  <Link
                    to="/login"
                    className="text-blue-500 hover:underline"
                  >
                    Login here
                  </Link>
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
