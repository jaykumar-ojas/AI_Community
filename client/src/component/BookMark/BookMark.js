import React, { useState } from "react";
import {BookmarkIcon} from "../../asset/icons"; // assuming this supports filled and outlined mode
import { LoginContext } from "../ContextProvider/context";

const BookMark = ({ userId, postId, isBookmarked }) => {
  // const [isBookmarked, setIsBookmarked] = useState(initialState);
  const [booked ,setBooked] = useState(isBookmarked);
  const token = localStorage.getItem("userdatatoken");
  const baseUrl = process.env.REACT_APP_BASE_URL;


  const handleBookMark = async () => {
   // console.log("i m going to bacend in");
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
        setBooked(!booked);
      //  console.log("i m setting bookedmark",booked);
      } else {
        console.error("");
      }
    } catch (error) {
      console.error("");
    }
  };

  return (
    <button onClick={handleBookMark} className="p-2">
      {/* You can conditionally show filled/outlined icon */}
      <BookmarkIcon isBookmarked={booked}/>
     
    </button>
  );
};

export default BookMark;
