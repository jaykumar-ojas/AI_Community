import React, { useState } from "react";
import { Link } from "react-router-dom";

const Register = () => {
  const [show, setShow] = useState(false);
  const [inpVal,setInpVal]= useState({
    "userName":"",
    "email":"",
    "password":"",
    "confirmPassword":""
  });

  const addUserData=async(e)=>{
    e.preventDefault();
    
    const {userName,email,password,confirmPassword}=inpVal;

    if(userName===""){
      alert("userName required");
    }
    else if(email===""){
      alert("email field is empty")
    }
    else if(password===""){
      alert("password field is empty")
    }
    else if(confirmPassword===""){
      alert("password2 is required");
    }
    else if(password!=confirmPassword){
      alert("password is not matched")
    }
    else{
      
      const data= await fetch("http://localhost:8099/register",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(
          {
            userName,email,password,confirmPassword
          }
        )
      });
      const res= await data.json();
      console.log(res);
    }
  }

  console.log(inpVal);

  const setVal=(e)=>{
    // console.log(e.target.value);
    const {name,value}=e.target;

      setInpVal(()=>{
        return{
          ...inpVal,
          [name]:value
        }
      })
  }



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
                  name="userName"
                  value={inpVal.userName}
                  onChange={setVal}
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
                  name="email"
                  value={inpVal.email}
                  onChange={setVal}
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
                    name="password"
                    onChange={setVal}
                    value={inpVal.password}
                    className="w-full rounded-full bg-white p-3 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                    placeholder="Enter your password"
                  />
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {!show ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-gray-600"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-gray-600"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </div>
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
                    name="confirmPassword"
                    onChange={setVal}
                    value={inpVal.confirmPassword}
                    className="w-full rounded-full bg-white p-3 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                    placeholder="Confirm your password"
                  />
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {!show ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-gray-600"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-gray-600"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </div>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs">
                <button className="w-full rounded-full bg-orange-600 py-3 font-bold text-white hover:bg-orange-800" onClick={addUserData}>
                  Register
                </button>
                <div className="mt-4 text-center">
                  <span>Already a member i am jay now? <Link to="/login" className="text-orange-500 hover:underline">Login</Link></span>
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
