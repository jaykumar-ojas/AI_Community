import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { getUserFromCache, saveUserToCache } from "../../utils/cacheUtils"; // adjust path
import "react-loading-skeleton/dist/skeleton.css";

const UserNameCard = ({ id }) => {
  const [userName, setUserName] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const cachedUser = getUserFromCache(id);

    if (cachedUser?.userName) {
      setUserName(cachedUser.userName);
      setLoading(false);
    } else {
      getUserName();
    }
  }, [id]);

  const getUserName = async () => {
    try {
      const res = await fetch(`http://localhost:3000/getUserById/${id}`);
      const json = await res.json();

      if (json.status === 200) {
        const { userName, profilePictureUrl } = json.user;
        saveUserToCache(id, { userName, profilePictureUrl });
        setUserName(userName);
      }
    } catch (err) {
      console.log("Failed to fetch username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-w-[60px]">
      {loading ? (
        <Skeleton width={60} height={14} baseColor="#d1d5db" highlightColor="#6b7280" />
      ) : (
        <span>{userName}</span>
      )}
    </div>
  );
};

export default UserNameCard;
