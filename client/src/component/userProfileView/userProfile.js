import bg from "../../asset/backGroundImage.png";
import UserHeader from "./Component/UserHedaer";
import TabProfile from "./Component/TabProfile";
import { useState } from "react";



const UserProfile = () => {
  

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-7xl mx-auto bg-white sm:rounded-xl shadow-lg overflow-hidden">

        <UserHeader/>

        {/* Content Section */}
        <div className="p-4 border-gray-200 text-gray-700">
          <TabProfile/>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;