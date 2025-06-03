import React, { useContext } from 'react';
import { ForumContext } from '../../ContextProvider/ModelContext';


function ModelItem({ name, active = false, onClick }) {
    return (
      <li>
        <button
          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-150 cursor-pointer ${
            active
              ? 'bg-like_color text-text_header font-medium'
              : 'text-text_header hover:bg-like_color'
          }`}
          onClick={() => onClick(name)}
        >
          {name}
        </button>
      </li>
    );
  }


const ModelList = () => {
const { model, setModel } = useContext(ForumContext);

const aiModels = ["GPT-4", "DALL-E", "Claude", "Stable Diffusion", "Midjourney","Sora","Googel-veo"];

return (
    <div className="w-full flex flex-col">

    {/* AI Models Section */}
    <div className="p-4">
        <div className="font-semibold mb-2 text-text_header text-sm">AI MODEL</div>
        <ul className="space-y-1">
        {aiModels.map((name) => (
            <ModelItem
            key={name}
            name={name}
            active={model === name}
            onClick={() => setModel(name)}
            />
        ))}
        </ul>
    </div>
    </div>
);
};

export default ModelList;

