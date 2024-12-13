import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [show, setShow] = useState(false);
  const [inpVal,setInpVal]=useState({
    "email":"",
    "password":""
  })

  const history = useNavigate();

  console.log(inpVal);
  const setVal=(e)=>{
    
    const {name,value}=e.target;
    setInpVal(()=>{
      return {
        ...inpVal,
        [name]:value
      }
    })
  }

  const addUserLogin=async(e)=>{
    e.preventDefault();
    const {email,password}=inpVal;
    if(email===""){
      alert("email is required");
    }
    else if(password===""){
      alert("password is required");
    }
    else{
      const data=await fetch("http://localhost:8099/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          email,password
        })
      })
      console.log("request done");

      const res=await data.json();
      console.log(res);
      if(data.status===201){
        alert("login successfully");
        localStorage.setItem("userdatatoken",res.token);
        history("/");
        setInpVal({...inpVal,email:"",password:""});
      }
      else{
        alert("some error occured");
      }
    }
  }

  const islogin=async()=>{
    const token=localStorage.getItem("userdatatoken");

    const data = await fetch("http://localhost:8099/validuser",{
      method:"GET",
      headers:{
        "Content-Type":"application/json",
        "Authorization":token,
        Accept:"application/json"
      },
      credentials:"include"
    });

    const res = await data.json();

    if(!data || data.status==401){
      console.log("invalid user");
    }
    else{
      history("/");
    }
  }

  useEffect(()=>{
    islogin();
  },[]);

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* Left Section */}
      <div className="flex flex-grow bg-black text-white md:w-1/2">
        <div className="mx-auto flex w-4/5 max-w-md flex-col justify-center">
          <div className="text-center">
          <p className="text-4xl font-bold mb-2">Welcome to PixxelMind</p>
          <p className="text-lg text-gray-300">Login</p>
          </div>
          <div className="my-6">
            <button className="flex w-3/4 mx-auto justify-center rounded-3xl bg-white p-2 text-black hover:bg-gray-200">
              <img
                src="https://freesvg.org/img/1534129544.png"
                className="mr-2 w-6 object-fill"
                alt="Google Icon"
              />
              Sign in with Google
            </button>
          </div>
          <div className="mt-6">
            <fieldset className="border-t border-gray-600">
              <legend className="mx-auto px-2 text-center text-sm">
                Or login via our secure system
              </legend>
            </fieldset>
          </div>
          <div className="mt-6">
            <form className="flex flex-col items-center">
              <div className="w-full max-w-xs">
                <label className="mb-2.5 block font-extrabold" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={inpVal.email}
                  onChange={setVal}
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
                    name="password"
                    value={inpVal.password}
                    onChange={setVal}
                    className="w-full rounded-full bg-white p-2.5 text-black placeholder-indigo-900 shadow placeholder:opacity-30"
                    placeholder="Enter your password"
                  />
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
              <div className="mt-4 flex w-full max-w-xs justify-between">
                <div>
                  <input type="checkbox" id="remember" />
                  <label htmlFor="remember" className="ml-2 text-sm">
                    Remember me
                  </label>
                </div>
                <div>
                  <a href="#" className="text-sm hover:text-gray-200">
                    Forgot password
                  </a>
                </div>
              </div>
              <div className="my-6 w-full max-w-xs">
                <button className="w-full rounded-full bg-orange-600 p-4 hover:bg-orange-800" onClick={addUserLogin}>
                  Login
                </button>
                <div className="mt-4 text-center">
                  <span>Not a member? <Link to="/register" className="text-orange-500 hover:underline">Register</Link></span>
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

export default Login;
