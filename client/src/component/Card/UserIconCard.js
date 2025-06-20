import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { getUserFromCache, saveUserToCache } from "../../utils/cacheUtils"; // adjust path
import "react-loading-skeleton/dist/skeleton.css";

const UserIconCard = ({ id }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const cachedUser = getUserFromCache(id);

    if (cachedUser?.profilePictureUrl) {
      setImageUrl(cachedUser.profilePictureUrl);
      setLoading(false);
    } else {
      getUserInfo();
    }
  }, [id]);

  const getUserInfo = async () => {
    try {
      const res = await fetch(`http://localhost:3000/getUserById/${id}`);
      const json = await res.json();

      if (json.status === 200) {
        const { userName, profilePictureUrl } = json.user;
        saveUserToCache(id, { userName, profilePictureUrl });
        setImageUrl(profilePictureUrl);
      }
    } catch (err) {
      console.log("Failed to fetch profile image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/sample-user/${id}`)}
      className="relative w-full h-full rounded-full overflow-hidden cursor-pointer"
    >
      {loading ? (
        <Skeleton
          circle
          width="100%"
          height="100%"
          baseColor="#d1d5db"
          highlightColor="#6b7280"
        />
      ) : (
        <img
          src={imageUrl}
          alt="User"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default UserIconCard;
