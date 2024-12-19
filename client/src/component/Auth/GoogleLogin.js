import React from "react";

const GoogleLogin = () => {
    const loginwithGoogle =()=>{
        window.open("http://localhost:8099/auth/google/callback","_self");
    }
    return (
        <div className="my-6">
            <button onClick={loginwithGoogle} className="flex w-3/4 mx-auto justify-center rounded-3xl bg-white p-2 text-black hover:bg-gray-200">
              <img
                src="https://freesvg.org/img/1534129544.png"
                className="mr-2 w-6 object-fill"
                alt="Google Icon"
              />
              Sign in with Google
            </button>
          </div>
    )
}

export default GoogleLogin;