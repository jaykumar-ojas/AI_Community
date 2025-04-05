import React, { useEffect, useState } from "react";
import { API_BASE_URL, getAuthHeaders, handleAuthError } from "../../AiForumPage/components/ForumUtils";
import axios from "axios";
import { useParams } from "react-router-dom";

const AiTextContent = ({onClose,setNewReply,content}) => {
    const {topicId} = useParams();
    const [aiTextPrompt,setAiTextPrompt] = useState("");
    const [error, setError] = useState();
    const [generatingAIText,setGeneratingAIText] = useState(false);
    const [topic,setTopic] = useState();

    useEffect(()=>{
        if(topicId)
        fetchTopic()
    },[topicId]);

    const fetchTopic = async () => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/forum/topics/${topicId}`,
            {
              headers: getAuthHeaders(),
            }
          );
          setTopic(response.data.topic);
        } catch (err) {
          if (handleAuthError(err, setError)) {
            return;
          }
          console.error("Error fetching topic:", err);
          setError("Failed to load topic. Please try again later.");
        }
      };

    const handleGenerateAIText = async () => {
        if (!aiTextPrompt.trim()) {
          alert('Please enter a prompt for the AI response');
          return;
        }
        
        setGeneratingAIText(true);
        setError(null);
        
        try {
          const response = await axios.post(`${API_BASE_URL}/generateTopicResponse`, {
            topicContent: topic?.content,
            userMessages: aiTextPrompt
          }, { headers: getAuthHeaders() });
          
          if (response.data.response) {
            // Add both the user's prompt and AI response to the appropriate content field
              setNewReply(prev => {
                const promptText = `[User's Question]\n${aiTextPrompt}\n\n`;
                const aiResponse = `[AI Response]\n${response.data.response}\n\n`;
                return prev ? prev + '\n\n' + promptText + aiResponse : promptText + aiResponse;
              });
            // Close the AI text response modal
            setTimeout(() => {
              onClose(false);
              setAiTextPrompt('');
            }, 500);
          } else if (response.data.error) {
            setError(response.data.error);
          } else {
            setError('Failed to generate AI response. Please try again.');
          }
        } catch (err) {
          console.error('Error generating AI response:', err);
          
          if (!handleAuthError(err, setError)) {
            if (err.response?.data?.error) {
              setError(err.response.data.error);
            } else {
              setError('Failed to generate AI response. Please try again or check your internet connection.');
            }
          }
        } finally {
          setGeneratingAIText(false);
        }
      };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Generate AI Text Response</h3>
          <button
            onClick={() => {
              onClose(false);
              setAiTextPrompt("");
            }}
            className="text-gray-400 hover:text-gray-600"
          >
           <CrossIcon/>
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What would you like to ask?
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              placeholder="Ask anything about the topic..."
              value={aiTextPrompt}
              onChange={(e) => setAiTextPrompt(e.target.value)}
              disabled={generatingAIText}
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={() => {
              onClose(false);
              setAiTextPrompt("");
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={generatingAIText}
          >
            Cancel
          </button>
          <button
            onClick={() => handleGenerateAIText()}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            disabled={!aiTextPrompt.trim() || generatingAIText}
          >
            {generatingAIText ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
               <GenerateIcon/>
                Generate Response
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTextContent;

const CrossIcon = () =>{
    return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
    </svg>
    )
};

const GenerateIcon = () =>{
    return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
    )
};
