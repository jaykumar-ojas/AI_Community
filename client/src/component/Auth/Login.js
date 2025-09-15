import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GoogleLogin from "../Auth//GoogleLogin";
import { LoginContext } from "../ContextProvider/context";
import { useNotification } from "../ContextProvider/NotificationContext";

const Login = () => {
  const {showNotification} = useNotification();
  const {loginData,setLoginData} = useContext(LoginContext);
  const [show, setShow] = useState(false);
  const [inpVal,setInpVal]=useState({
    "email":"",
    "password":""
  })
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = process.env.REACT_APP_BASE_URL;


  const history = useNavigate();
  const location = useLocation();

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
      showNotification("email is required","warning");
      setIsLoading(false);
    }
    else if(password===""){
      showNotification("password is required","warning");
      setIsLoading(false);
    }
    else{
      setIsLoading(true);
      try {
        const data=await fetch(`${baseUrl}/login`,{
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            email,password
          })
        })
        const res=await data.json();
        if(res.status===201){
          showNotification("Welcome Back to pixxelmind where creativity meets you","success");
          setIsLoading(false);
          localStorage.setItem("userdatatoken",res.token);
          localStorage.setItem("userData", JSON.stringify(res)); 
          setInpVal({...inpVal,email:"",password:""});
          setTimeout(() => {
            if(location.pathname =="/login"){
              history("/");
            }
          }, 1500);
        }
        else{
          console.log(res);
          showNotification(res.error,"error");
          setIsLoading(false);
        }
      } catch (err) {
        setIsLoading(false);
        showNotification("network Error","error");
      }
    }
  }

  const islogin=async()=>{
    const token=localStorage.getItem("userdatatoken");

    try{
    const data = await fetch(`${baseUrl}/validuser`,{
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

    }
    else{
      setLoginData(res);
      console.log("user login already",res);
      history("/");
    }
  }
  catch(error){
    showNotification(error,"error");
  }
  }

  useEffect(()=>{
    islogin();
  },[]);

  return (
    <div className="z-20 fixed inset-0 bg-black/95  flex justify-center items-center p-4">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="relative flex w-full max-w-4xl flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Section */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-black text-white px-8 py-10">
          <div className="text-center">
            <p className="text-3xl font-semibold mb-2">Welcome to PixxelMind</p>
            <p className="text-lg text-gray-300">Login</p>
          </div>
    
          <div className="w-full md:max-w-sm mt-6">
            {/* Google Login */}
            <GoogleLogin />
    
            <div className="mt-6">
              <fieldset className="border-t border-gray-600">
                <legend className="mx-auto px-2 text-center text-sm">Or login via our secure system</legend>
              </fieldset>
            </div>
    
            {/* Login Form */}
            <form className="mt-6 space-y-4">
              <div>
                <label className="block font-bold mb-1" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={inpVal.email}
                  onChange={setVal}
                  className="w-full rounded-lg bg-gray-800 text-white p-3 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  placeholder="mail@user.com"
                />
              </div>
    
              <div>
                <label className="block font-bold mb-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    id="password"
                    name="password"
                    value={inpVal.password}
                    onChange={setVal}
                    className="w-full rounded-lg bg-gray-800 text-white p-3 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your password"
                  />
                  <div
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShow(!show)}
                  >
                    {/* {!show ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )} */}
                  </div>
                </div>
              </div>
    
              {/* Remember Me & Forgot Password */}
              <div className="flex justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" id="remember" className="form-checkbox text-orange-500" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-orange-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
    
              {/* Login Button */}
              <button
                type="button"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition"
                onClick={addUserLogin}
              >
                Login
              </button>
    
              {/* Register Link */}
              <p className="text-center text-sm">
                Not a member?{" "}
                <Link to="/register" className="text-orange-400 hover:underline">
                  Register
                </Link>
              </p>
            </form>
          </div>
        </div>
    
        {/* Right Section */}
        <div className="hidden md:block md:w-1/2">
          <img
            src="https://images.pexels.com/photos/2523959/pexels-photo-2523959.jpeg"
            className="h-full w-full object-cover"
            alt="Login Illustration"
          />
        </div>
      </div>
    </div>
    
  );
};

export default Login;
