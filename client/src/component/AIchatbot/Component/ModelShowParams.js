import React from "react";

const ModelShowParams =({ name, displayName, iconUrl, emoji, provider, active = false, onClick }) => {
    return (
        <li>
            <button
                type="button"
                className={`w-full text-left px-2 py-2 rounded-md transition-all duration-150 cursor-pointer flex items-center space-x-2 ${
                    active
                        ? 'bg-like_color text-text_header font-medium transform scale-[1.02]'
                        : 'text-black text-sm dark:text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]'
                }`}
                onClick={() => onClick(name,provider)}
            >
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
                <span className="text-xl" style={{ display: iconUrl ? 'none' : 'inline' }}>{emoji}</span>
                <span className='text-md'>{displayName}</span>
            </button>
        </li>
    );
}

export default ModelShowParams;