import React, { useContext, useState } from "react";
import { LoginContext } from "../ContextProvider/context";
import { DownvoteIcon, UpvoteIcon } from "../../asset/icons";

const LikeDislike2 = ({ topic, like, dislike, isLiked=false,isDisliked=false , likeCount, dislikeCount }) => {
  const [likePop, setLikePop] = useState(false);
  const [dislikePop,setDislikePop] = useState(false);

  const handleLike = () =>{
    setLikePop(!likePop);
    like();
    
  }

  const handleDislike = () =>{
    setDislikePop(!dislikePop);
    dislike();
  }

  return (
   <div className="text-low_text2 hover:text-low_text cursor-pointer">
    <div className="flex border group border-nav_hover3  bg-black  rounded-full px-2 py-1 gap-2">
        <button onClick={handleLike} className={`flex pr-2 ${isLiked? "text-theme_color hover:text-theme_color3" : ""} border-r border-low_text2 hover:border-low_text  items-center gap-1 hover:scale-1.2`}>
            <div className={`${likePop ? "animate-pop" : ""}`}>
                 <UpvoteIcon isUpvoted={isLiked}/>
            </div>
           <div className="font-semibold">
             {likeCount}
           </div>
        </button>
        
         <button onClick={handleDislike} className={`flex ${isDisliked ? "text-red-600" : ""} items-center  justify-center gap-1`}>
            <div className={`${dislikePop ? "animate-pop" : ""}`}>
                 <DownvoteIcon isDownvoted={isDisliked}/>
            </div>
           <div className="font-semibold">
             {dislikeCount}
           </div>
        </button>
        
    
    </div>
    </div>
  );
};

export default LikeDislike2;






