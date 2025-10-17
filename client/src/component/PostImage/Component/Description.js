import React, { useContext } from "react";
import { PostContext } from "../PostContext";

const Description = () => {
  const { desc, setDesc } = useContext(PostContext);

  const setChange = (e) => {
    setDesc(e.target.value);
  };

  return (
    <div className="w-full pt-0 md:px-6 md:py-4 relative bg-transparent">
      <div className="md:text-xl text-md  px-2 font-merriweather font-semibold text-gray-700 dark:text-low_text mb-3">Description</div>

      <div className="relative">
        <textarea
          onChange={setChange}
          value={desc}
          placeholder="Speak to people..."
          rows="6"
          className="w-full p-4 font-poppins bg-gray-200 dark:placeholder-gray-400 placeholder-gray-600 dark:bg-nav_hover border border-nav_hover2 dark:border-nav_hover2 rounded-lg  focus:outline-none focus:ring-2 focus:ring-nav_hover2 resize-none text-gray-800 dark:text-low_text text-sm"
        />

        <div className="absolute bottom-2 right-3 text-xs dark:text-gray-200 text-gray-800">
          {desc?.length || ""}
        </div>
      </div>
    </div>
  );
};

export default Description;
