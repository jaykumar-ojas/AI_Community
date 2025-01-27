import React from "react";
import { useNavigate } from "react-router-dom";

const Card = ({post}) => {
  console.log(post);
  const navigate = useNavigate();
  const handleCardClick = () => {
    navigate(`/userPost/${post?._id}`);
  };

  return (
    <div onClick={handleCardClick} className="group border rounded-lg h-72 w-96 overflow-hidden relative hover:cursor-pointer">
      <div className="h-full w-full">
        <img
          src={post.signedUrl}
          className="h-full w-full object-cover opacity-95 hover:opacity-100 transition duration-300"
          alt="Card Image"
        />
        {/* Hidden div to show on hover */}
        <div className="absolute top-2 left-2 flex items-center gap-2 p-2 rounded-lg bg-white  opacity-0 bg-opacity-0 transition duration-700 group-hover:opacity-100 group-hover:bg-opacity-0">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKT8Lsye7-vjntnRIJIPB2bTlcBwEFuSKPQma5gaX_VcGzrgmijOizhOI&s"
            className="h-8 w-8 rounded-full"
            alt="Profile"
          />
          <div className="text-customgray-800 font-semibold">{post.desc}</div>
        </div>
        <div className="absolute bottom-6 left-4 opacity-0 bg-opacity-0 transition duration-700 group-hover:opacity-100 group-hover:bg-opacity-0 text-white-300 font-semibold">{post.desc}</div>

      </div>
    </div>
  );
};

export default Card;
