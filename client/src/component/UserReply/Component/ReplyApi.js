import axios from "axios";
import React from "react";
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils";


const baseUrl = process.env.REACT_APP_BASE_URL;

export const fetchModelInfo = async (modelName) => {
    try {
      const response = await axios.get(
        `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch {
      return null;
    }
};

export const describeImagesInBackground = async (replyId, postingData,selectedFiles) => {
    const hasImages = postingData.some(
      (entry) =>
        entry.imageUrl ||
        selectedFiles.some((file) => file.type.startsWith("image/"))
    );
    if (!hasImages) return;

    try {
      await axios.put(
        `${baseUrl}/describe-images/${replyId}`,
        {},
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      console.error("Error describing images:", err);
    }
  };