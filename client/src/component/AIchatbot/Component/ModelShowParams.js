import React from "react";
import { DynamicNumberSVG } from "../../../asset/icons";
import { modelCreditConfig } from "./ModelApi";

const ModelShowParams =({ name, displayName, iconUrl, emoji, provider, active = false, onClick }) => {
    return (
        <li>
            <button
                type="button"
                className={`w-full font-['Inter'] font-semibold  px-2 py-2 rounded-md transition-all duration-150 cursor-pointer flex justify-between items-center space-x-2 ${
                    active
                        ? 'text-text_header font-medium transform scale-[1.02]'
                        : 'text-black text-md dark:text-low_text hover:dark:text-theme_color2 hover:transform hover:scale-[1.02]'
                }`}
                onClick={() => onClick(name,provider)}
            >
                <div className="inline flex gap-2 justify-start items-center">
                    {iconUrl ? (
                    <img 
                        src={iconUrl} 
                        alt={displayName} 
                        style={{ width: 20, height: 20, borderRadius: '50%' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                        }}
                    />
                ) : null}
                {/* <span className="text-xl" style={{ display: iconUrl ? 'none' : 'inline' }}>{emoji}</span> */}
                <span className={`text-md line-clamp-1 ${iconUrl ? '' : 'ml-7'}`}>{displayName}</span>
                </div>
                <div className="">
                    <DynamicNumberSVG value={modelCreditConfig[name]?.cost} size={6}/>
                </div>
               
            </button>
        </li>
    );
}

export default ModelShowParams;