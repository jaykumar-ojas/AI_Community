import React from "react";

const UserProfile = () => {
  return (
    <div className="min-h-screen mx-auto ">
      <div className="flex flex-col border border-red-700 roudend-full justify-between m-20">
        <div className="flex flex-row border border-green-700 justify-start m-2">
          <div className="flex items-center justify-center bg-white h-48 w-48 m-2 border border-yellow-700">
            <img
              className="w-36 h-36 rounded-full bg-gray-700"
              src="path-to-your-image.jpg"
              alt="Description"
            />
          </div>
          <div className="flex flex-col space-y-2 w-full h-full border border-custom1 my-2 mr-2 p-2">
          <div className="relative w-full h-full border border-pink-700 p-2">
                <div className="text-2xl font-bold font-thin italic text-gray-900">
                    Jay kumar gupta
                </div>
                <div className="text-1xl font-bold italic text-gray-900">
                    guptajay201@gmail.com
                </div>
                <div className="text-1xl font-bold italic text-gray-900 w-64 border border-black-300">
                    i am jay i am maker of this custom page and i am here adding data
                </div>
          </div>
          <div className="w-full h-full border border-yellow-300 flex justify-between p-2">
                <div className="text-lg font-medium">Post 30</div>
                <div className="text-lg font-medium">Followers 12.3k</div>
                <div className="text-lg font-medium">Following 8k</div>
          </div>
          </div>
        </div>

        <div className="h-64"></div>
      </div>
    </div>
  );
};

export default UserProfile;
