import React, { useEffect, useState } from "react";
import ModelList from "./ModelList";
import axios from "axios";
import { API_BASE_URL } from "../../AiForumPage/components/ForumUtils";


const ModelIcon = ({ modelName, name=true }) => {
  const [iconUrl, setIconUrl] = useState(null);

  useEffect(() => {
    if (!modelName) return;
    const fetchIcon = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/aimodels/search?modelName=${encodeURIComponent(
            modelName
          )}`
        );
        if (response.data.success) {
         // console.log(response.data.data);
          setIconUrl(response.data.data.iconUrl);
       //   console.log(modelName, response.data.data.iconUrl);
        }
      } catch (err) {
        setIconUrl(null);
      }
    };
    fetchIcon();
  }, [modelName]);

  if (!iconUrl) return null;
  return (
    <div className="flex items-center gap-1 bg-black-50 px-2 py-1 rounded-md">
      <img
        src={iconUrl}
        alt={modelName}
        className="w-4 h-4 md:w-6 md:h-6 rounded-full"
        // style={{ width: 24, height: 24, borderRadius: "50%" }}
      />
      {name && <span className="text-xs text-blue-700 font-medium">{modelName}</span>}
    </div>
  );
};

export default ModelIcon;