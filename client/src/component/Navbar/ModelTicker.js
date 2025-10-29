import React from "react";
import { useNavigate } from "react-router-dom";
import { modelCreditConfig } from "../AIchatbot/Component/ModelApi"; // adjust path

const modelIcons = {
  "gemini-2.0-flash": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/dfca6f8141c11730c5fbe1d7bd211ab1.png",
  "gemini-2.0-flash-lite": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/7612e1e9d6009ffe1aaf3b12d0db07b8.png",
  "gemini-2.5-flash": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/c80ebc760956aae7e40faae5139edba1.png",
  "gemini-2.5-pro": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/55f96947fe88e8e06bf172c6b38f84c0.png",
  "gpt-4.1": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/816e32fc4b5eb272eeeb0b9a2225ecb1.png",
  "gpt-5": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/44172815a12f869125305fa9d2e4334a.png",
  "gpt-5-mini": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/c99885408fcfea26ccb8978b3a5c84b0.png",
  "gpt-5-nano": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/9032526dc42715a23bd5a398de4f0352.png",
  "grok-3-mini": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/733b2bee53b2c1dd90ea373525a5a5d2.png",
  "grok-3-mini-fast": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/40bc6ad141c108bc10f0c61e53925c33.png",
  "grok-4": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/2c29e4bcbd9828fad2005e23c5bfaf05.png",
  "llama-3.1-8b-instant": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/225579b408fcf5cc4c82bde27cddb2e3.png",
  "llama-3.3-70b-versatile": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/334261b330550d2232eb56f04fba7ae8.png",
  "meta-llama/llama-4-maverick-17b-128e-instruct": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/ab24734cb9df87e342bae98ff18f6d48.png",
  "meta-llama/llama-4-scout-17b-16e-instruct": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/83fc283fd15865b4172a4e5f660c8cc6.png",
  "meta-llama/llama-guard-4-12b": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/8663f5d4afada4a685bd709a2a6cae23.png",
  "o4-mini": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/9b4df6e08c019b66e0ab8e8d5e0d3fdd.png",
  "qwen/qwen3-32b": "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/89642632ccec2ffd241ed1c619c920cc.png",
};

const ModelTicker = () => {
  const navigate = useNavigate();
  // show only models that exist in modelIcons
  const models = Object.keys(modelCreditConfig).filter((m) => modelIcons[m]);

  const handleClick = (model) => {
    navigate("/post", { state: { selectedModel: model } });
  };

  return (
    <div className="w-full overflow-hidden my-0 group">
      <div className="flex whitespace-nowrap animate-scroll font-poppins text-xs md:text-xs font-extrabold text-gray-800 dark:text-theme_color group-hover:[animation-play-state:paused]">
        {[...models, ...models].map((model, index) => (
          <button
            key={index}
            onClick={() => handleClick(model)}
            className="flex items-center gap-1 px-4 hover:text-theme_color3 transition-all duration-300 cursor-pointer"
          >
            <img
              src={modelIcons[model]}
              alt={model}
              className="w-4 h-4 rounded-full object-contain"
            />
            {model}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelTicker;
