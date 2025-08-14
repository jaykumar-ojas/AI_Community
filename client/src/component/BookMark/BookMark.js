import React, { useState } from "react";
import BookmarkIcon from "../../asset/icons"; // assuming this supports filled and outlined mode
import { LoginContext } from "../ContextProvider/context";

const BookMark = ({ userId, postId, isBookmarked: initialState }) => {
  const [isBookmarked, setIsBookmarked] = useState(initialState);
  const token = localStorage.getItem("userdatatoken");
  const baseUrl = process.env.REACT_APP_BASE_URL;


  const handleBookMark = async () => {
    console.log("i m going to bacend in");
    try {
      const response = await fetch(`${baseUrl}/bookMark/${userId}/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsBookmarked((prev) => !prev);
      } else {
        console.error("Bookmark toggle failed:", data.error);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  return (
    <button onClick={handleBookMark} className="p-2">
      {/* You can conditionally show filled/outlined icon */}
      <BookmarkIcon fill={isBookmarked ? "#000" : "#ffff"} stroke="#000" strokeWidth={1.5} />
    </button>
  );
};

export default BookMark;
