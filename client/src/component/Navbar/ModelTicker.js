import React from "react";
import { useNavigate } from "react-router-dom";
import { modelCreditConfig } from "../AIchatbot/Component/ModelApi"; // adjust path

const ModelTicker = () => {
  const navigate = useNavigate();
  const models = Object.keys(modelCreditConfig);

  const handleClick = (model) => {
    navigate("/post", { state: { selectedModel: model } });
  };

  return (
    <div className="w-full overflow-hidden my-0 group">
      <div className="flex whitespace-nowrap animate-scroll font-poppins text-xs md:text-xs font-extrabold text-gray-800 dark:text-theme_color  group-hover:[animation-play-state:paused]">
        {[...models, ...models].map((model, index) => (
          <button
            key={index}
            onClick={() => handleClick(model)}
            className="px-3 hover:text-theme_color3 transition-all duration-300 cursor-pointer"
          >
            {model}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelTicker;
