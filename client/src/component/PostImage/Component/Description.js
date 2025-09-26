import React, { useContext } from "react";
import { PostContext } from "../PostContext";

const Description = () => {
  const { desc, setDesc } = useContext(PostContext);

  const setChange = (e) => {
    setDesc(e.target.value);
  };

  return (
    <div className="w-full pt-0 md:px-6 md:py-4 relative bg-transparent">
      <h2 className="text-xl px-2 font-semibold text-gray-700 dark:text-text_header mb-3">Description</h2>

      <div className="relative">
        <textarea
          onChange={setChange}
          value={desc}
          placeholder="Speak to people..."
          rows="6"
          className="w-full p-4 bg-gray-200 dark:placeholder-gray-400 placeholder-gray-600 dark:bg-bg_comment border border-gray-300 dark:border-gray-700 rounded-lg  focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-800 dark:text-gray-200 text-sm"
        />

        <div className="absolute bottom-2 right-3 text-xs dark:text-gray-200 text-gray-800">
          {desc?.length || ""}
        </div>
      </div>
    </div>
  );
};

export default Description;
