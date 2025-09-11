import React, { useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Context, { ForumContext } from '../../ContextProvider/ModelContext';
import ModelShowParams from './ModelShowParams';
import { fetchIconUrl, fetchModelConfig,loadIcons, modelCreditConfig} from './ModelApi';
import { CommentContext } from '../../ContextProvider/CommentModelContext';
const baseUrl = process.env.REACT_APP_BASE_URL;





const ModelList = ({forum=false, userForum=false, userComment=false, closeDropdown}) => {
    const forumContext = useContext(ForumContext);
    const commentContext = useContext(CommentContext);

    // pick one based on props
    const { model, setModel, modelType, setModelType, setProvider } =
    forum || userForum ? forumContext : commentContext;
    const [iconUrls, setIconUrls] = useState({});
    const {
        data: modelConfig = { text: {}, image: {} },
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['model-config'],
        queryFn: fetchModelConfig,
        staleTime: 1000 * 60 * 60, // 5 mins
    });
    console.log("this is model data",modelConfig);

    // Fetch icons after modelConfig is available
    useEffect(() => {
        loadIcons(modelConfig,modelType,iconUrls,setIconUrls);
    }, [modelConfig, modelType]);

    // Removed auto-selection of default model - user must manually select

    const handleModelSelect = (modelName,provider) => {
        setModel(modelName);
        setProvider(provider);
        if(closeDropdown){
            closeDropdown();
        }
    };

    const handleTypeSelect = (type) => {
        setModelType(type);
        setModel("");
    };

    if (isLoading) {
        return (
            <div className="w-full flex flex-col bg-transparent rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-b-transparent"></div>
                    <span className="ml-2 text-text_header">Loading models...</span>
                </div>
            </div>
        );
    }

    if (isError) {
        return <div className="p-4 text-red-500">Failed to load model configuration.</div>;
    }

    return (
        <>
            {forum && <SideBarModelsView
                model={model}
                modelType={modelType}
                modelConfig={modelConfig}
                handleTypeSelect={handleTypeSelect}
                handleModelSelect={handleModelSelect}
                iconUrls={iconUrls}
            />}
            {(userForum || userComment) && <BottomModelView
                model={model}
                modelType={modelType}
                modelConfig={modelConfig}
                handleTypeSelect={handleTypeSelect}
                handleModelSelect={handleModelSelect}
                iconUrls={iconUrls}
            />}
        </>
    );
};

export default ModelList;

const SideBarModelsView = ({model, modelType, modelConfig, handleTypeSelect, handleModelSelect, iconUrls}) =>{
    return (
         <div className="w-full flex flex-col bg-transparent rounded-lg shadow-sm">
            {/* Model Type Selection */}
            <div className="p-2 border-b border-gray-700">
                <div className="font-semibold mb-2 text-gray-900 dark:text-text_header text-l flex items-center">
                    <span className="mr-1">🎯</span> MODELS
                </div>
                <div className="flex justify-between items-center">
                    {['text', 'image'].map(type => (
                        <button
                            key={type}
                            className={`px-4 py-1 rounded-md w-full  text-sm flex items-center space-x-2 transition-all duration-150 ${
                                modelType === type
                                    ? 'bg-like_color text-text_header font-medium transform scale-[1.02]'
                                    : 'text-black dark:text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]'
                            }`}
                            onClick={() => handleTypeSelect(type)}
                        >
                            <span>{type === 'text' ? '✍️' : '🖼️'}</span>
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Models Section */}
            <div className="p-4 pt-0 overflow-y-auto max-h-[calc(100vh-5rem)]">
                <ul className="space-y-1 overflow-y-auto">
                    {Object.entries(modelConfig[modelType] || {}).map(([modelName, config]) => (
                        <ModelShowParams
                            key={modelName}
                            name={modelName}
                            provider={config.provider}
                            displayName={config.displayName}
                            iconUrl={iconUrls[modelName]}
                            emoji={config.emoji}
                            active={model === modelName}
                            onClick={handleModelSelect}
                        />
                    ))}
                </ul>
            </div>
        </div>
    )
}

const BottomModelView = ({model, modelType, modelConfig, handleTypeSelect, handleModelSelect, iconUrls})=>{
    return (
    <div className="relative">
      {/* Model Type Selector */}

      {/* Dropdown Button fixed at bottom navbar */}
      <div className="fixed bottom-12 left-1/4 transform -translate-x-8 w-64 z-50">
        {/* Dropdown list above button */}

        <ul className="absolute bottom-full mb-2 max-w-full max-h-64  overflow-y-auto bg-white  dark:bg-gray-800 rounded-md shadow-lg p-2 z-50">
          <div className="flex space-x-2 mb-2">
            {["text", "image"].map((type) => (
              <button
                type="button"
                key={type}
                className={`px-3 py-1 rounded-md text-sm flex items-center space-x-1 transition-all duration-150 ${
                  modelType === type
                    ? "bg-like_color text-text_header font-medium"
                    : "text-text_header hover:bg-like_color"
                }`}
                onClick={() => handleTypeSelect(type)}
              >
                <span>{type === "text" ? "✍️" : "🖼️"}</span>
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            ))}
          </div>

          {Object.entries(modelConfig[modelType] || {}).map(
            ([modelName, config]) => (
              <ModelShowParams
                key={modelName}
                name={modelName}
                provider={config.provider}
                displayName={config.displayName}
                iconUrl={iconUrls[modelName]}
                emoji={config.emoji}
                active={model === modelName}
                onClick={handleModelSelect}
              />
            )
          )}
        </ul>
      </div>
    </div>
    )
}
