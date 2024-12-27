import React, { useContext } from 'react';
import { LoginContext } from '../ContextProvider/context';

const ProfileCard = () => {

   const {loginData,setLoginData} = useContext(LoginContext);
   console.log("this is user page",loginData.validuserone.image);
  return (
    <div className="h-screen bg-gray-200 dark:bg-gray-800 flex flex-wrap items-center justify-center">
      <div className="container lg:w-2/6 xl:w-2/7 sm:w-full md:w-2/3 bg-white shadow-lg transform duration-200 ease-in-out">
        <div className="h-32 overflow-hidden">
          <img
            className="w-full"
            src="https://images.unsplash.com/photo-1605379399642-870262d3d051?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
            alt="Background"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex justify-center px-5 -mt-12">
          <img
            className="h-32 w-32 bg-white p-2 rounded-full"
            src={loginData.validuserone.image ? loginData.validuserone.image :"data:image/jpeg;base64,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"}
            alt="profile"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="text-center px-14">
            <h2 className="text-gray-800 text-3xl font-bold">{loginData.validuserone.userName}</h2>
            <a
              className="text-gray-400 mt-2 hover:text-blue-500"
              href="https://www.instagram.com/immohitdhiman/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {loginData.validuserone.email}
            </a>
            <p className="mt-2 text-gray-500 text-sm">
             this is for texting we modifed later
            </p>
          </div>
          <hr className="mt-6" />
          <div className="flex bg-gray-50">
            <div className="text-center w-1/2 p-4 hover:bg-gray-100 cursor-pointer">
              <p>
                <span className="font-semibold">2.5k </span> Followers
              </p>
            </div>
            <div className="border"></div>
            <div className="text-center w-1/2 p-4 hover:bg-gray-100 cursor-pointer">
              <p>
                <span className="font-semibold">2.0k </span> Following
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
