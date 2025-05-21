import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ForumContext } from "../ContextProvider/ModelContext";

const StateSelection = () => {
  const { replyIdForContext } = useContext(ForumContext);
  
  const [formData, setFormData] = useState({
    textPrompt: '',
    controlBits: {
      enhancePrompt: false,
      generateText: false,
      generateImage: false,
      processContextAware: false
    },
    contextType: 'forumReply',
    entityId: replyIdForContext || ''
  });

  // Update entityId when replyIdForContext changes
  React.useEffect(() => {
    if (replyIdForContext) {
      setFormData(prev => ({
        ...prev,
        entityId: replyIdForContext,
        controlBits: {
          ...prev.controlBits,
          processContextAware: true
        }
      }));
    }
  }, [replyIdForContext]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        controlBits: {
          ...prev.controlBits,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8099/stateselection', formData);
      setResult(response.data.result);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };
  console.log("this is my resposnse",result);
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">State Selection</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Prompt
          </label>
          <textarea
            name="textPrompt"
            value={formData.textPrompt}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows="4"
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Control Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enhancePrompt"
                checked={formData.controlBits.enhancePrompt}
                onChange={handleInputChange}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enhance Prompt</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="generateText"
                checked={formData.controlBits.generateText}
                onChange={handleInputChange}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Generate Text</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="generateImage"
                checked={formData.controlBits.generateImage}
                onChange={handleInputChange}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Generate Image</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="processContextAware"
                checked={formData.controlBits.processContextAware}
                onChange={handleInputChange}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Process Context Aware</span>
            </label>
          </div>
        </div>

        {formData.controlBits.processContextAware && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context Type
              </label>
              <input
                type="text"
                name="contextType"
                value={formData.contextType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity ID
              </label>
              <input
                type="text"
                name="entityId"
                value={formData.entityId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold">Results</h2>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Processing Steps</h3>
            <ul className="list-disc list-inside space-y-2">
              {result.processingSteps.map((step, index) => (
                <li key={index} className="text-gray-700">{step}</li>
              ))}
            </ul>
          </div>

          {result.enhancedPrompt && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">Enhanced Prompt</h3>
              <p className="text-gray-700">{result.enhancedPrompt}</p>
            </div>
          )}

          {result.generatedText && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">Generated Text</h3>
              <p className="text-gray-700">{result.generatedText}</p>
            </div>
          )}

          {result.generatedImageUrl && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">Generated Image</h3>
              <img
                src={result.generatedImageUrl}
                alt="Generated"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {result.contextAwareResponse && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">Context-Aware Response</h3>
              {result.contextAwareResponse.type === 'text' ? (
                <p className="text-gray-700">{result.contextAwareResponse.content}</p>
              ) : (
                <div>
                  <p className="text-gray-700 mb-2">{result.contextAwareResponse.description}</p>
                  <img
                    src={result.contextAwareResponse.imageUrl}                  
                    alt="Context-aware generated"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StateSelection; 