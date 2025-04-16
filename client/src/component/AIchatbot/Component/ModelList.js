import React, { useContext } from 'react';
import { ForumContext } from '../../ContextProvider/ModelContext';


function ModelItem({ name, active = false, onClick }) {
    return (
      <li>
        <button
          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-150 cursor-pointer ${
            active
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
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

const aiModels = ["GPT-4", "DALL-E", "Claude", "Stable Diffusion", "Midjourney"];

return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
    <div className="p-5 font-semibold text-lg border-b border-gray-200">
        chat bot forum
    </div>

    {/* AI Models Section */}
    <div className="p-4">
        <div className="font-semibold mb-2 text-sm">all ai's</div>
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

