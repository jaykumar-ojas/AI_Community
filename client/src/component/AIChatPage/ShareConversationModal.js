import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { LoginContext } from "../ContextProvider/context";
import { getAuthHeaders, handleAuthError, TOPICS_URL, REPLIES_URL } from "../AiForumPage/components/ForumUtils";
import { useNavigate } from "react-router-dom";
import { encodeId } from "../../utils/hashids";
import { useQuery } from "@tanstack/react-query";
import NewTopicModal from "../AiForumPage/components/NewTopicModal";
import { Search, Plus, X, Send, MessageSquare } from "lucide-react";

const baseUrl = process.env.REACT_APP_BASE_URL;

const fetchTopics = async (searchQuery = "") => {
    try {
        const url = searchQuery
            ? `${TOPICS_URL}?search=${encodeURIComponent(searchQuery)}&limit=20`
            : `${TOPICS_URL}?sort=popular&limit=20`;
        const response = await axios.get(url, {
            headers: getAuthHeaders(),
        });
        return response.data.topics || [];
    } catch (error) {
        if (!handleAuthError(error)) {
            console.error("Error fetching topics:", error);
        }
        return [];
    }
};

const ShareConversationModal = ({ onClose, conversationData, selectedFiles = [] }) => {
    const { loginData } = useContext(LoginContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: topics = [], isLoading } = useQuery({
        queryKey: ["communitySearch", debouncedSearch],
        queryFn: () => fetchTopics(debouncedSearch),
        staleTime: 1000 * 60 * 2,
        enabled: true,
    });

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        setShowPreview(true);
    };

    const handleCreateClick = () => {
        setIsCreating(true);
    };

    const handlePostConversation = async () => {
        if (!selectedTopic || !loginData) return;

        setIsPosting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("content", JSON.stringify(conversationData));
            formData.append("dynamicId", encodeId(selectedTopic._id));
            formData.append("userId", loginData.validuserone._id);
            formData.append("userName", loginData.validuserone.userName);

            // Append any selected files
            selectedFiles.forEach((file) => formData.append("media", file));

            const response = await axios.post(REPLIES_URL, formData, {
                headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
            });

            if (response.status === 201) {
                // Navigate to the topic where the conversation was posted
                navigate(`/forum/topic/${encodeId(selectedTopic._id)}`);
                onClose();
            }
        } catch (err) {
            if (handleAuthError(err, setError)) return;
            setError("Failed to post conversation. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleBackToList = () => {
        setShowPreview(false);
        setSelectedTopic(null);
    };

    const getConversationPreview = () => {
        const messages = conversationData.filter(item => item.userText || item.aiText);
        const messageCount = messages.length;
        const userMessages = messages.filter(item => item.userText).length;
        const aiResponses = messages.filter(item => item.aiText).length;

        return { messages, messageCount, userMessages, aiResponses };
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className="bg-white dark:bg-nav_hover rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-theme_color" />
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair text-gray-800 dark:text-text_header">
                                {showPreview ? "Review & Post" : "Share to Community"}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-nav_hover2 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600 dark:text-low_text" />
                        </button>
                    </div>

                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {!showPreview ? (
                        <>
                            {/* Search and Create Bar */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search communities to share your conversation..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-nav_hover2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color text-gray-800 dark:text-low_text"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateClick}
                                        className="px-6 py-3 bg-theme_color hover:bg-theme_color2 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="hidden sm:inline">Create Community</span>
                                        <span className="sm:hidden">Create</span>
                                    </button>
                                </div>

                                {/* Conversation summary */}
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        <strong>Ready to share:</strong> {getConversationPreview().messageCount} messages
                                        ({getConversationPreview().userMessages} from you, {getConversationPreview().aiResponses} AI responses)
                                    </p>
                                </div>
                            </div>

                            {/* Topics List */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : topics.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 dark:text-low_text text-lg">
                                            {searchQuery
                                                ? `No communities found for "${searchQuery}"`
                                                : "No communities available"}
                                        </p>
                                        {searchQuery && (
                                            <button
                                                onClick={handleCreateClick}
                                                className="mt-4 px-6 py-2 bg-theme_color hover:bg-theme_color2 text-white rounded-lg transition-colors"
                                            >
                                                Create "{searchQuery}" Community
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {topics.map((topic) => (
                                            <div
                                                key={topic._id}
                                                onClick={() => handleTopicSelect(topic)}
                                                className="p-4 bg-gray-50 dark:bg-nav_hover2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-theme_color cursor-pointer transition-all hover:shadow-lg"
                                            >
                                                <h3 className="font-semibold text-lg text-gray-800 dark:text-text_header mb-2 line-clamp-2">
                                                    {topic.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-low_text line-clamp-3 mb-3">
                                                    {topic.content}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1">
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                                />
                                                            </svg>
                                                            {topic.replyCount || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                />
                                                            </svg>
                                                            {topic.viewCount || 0}
                                                        </span>
                                                    </div>
                                                    <span>
                                                        {new Date(topic.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Preview Section */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="mb-4">
                                    <button
                                        onClick={handleBackToList}
                                        className="text-theme_color hover:text-theme_color2 font-medium text-sm flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back to communities
                                    </button>
                                </div>

                                {/* Selected Community */}
                                <div className="p-4 bg-theme_color/10 border border-theme_color rounded-lg mb-6">
                                    <p className="text-sm text-gray-600 dark:text-low_text mb-1">Posting to:</p>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-text_header">{selectedTopic.title}</h3>
                                </div>

                                {/* Conversation Preview */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 dark:text-text_header">Conversation Preview:</h4>
                                    <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-nav_hover2 rounded-lg">
                                        {getConversationPreview().messages.map((msg, idx) => (
                                            <div key={idx} className="space-y-2">
                                                {msg.userText && (
                                                    <div className="bg-white dark:bg-nav_hover p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You:</p>
                                                        <p className="text-sm text-gray-800 dark:text-low_text">{msg.userText}</p>
                                                    </div>
                                                )}
                                                {msg.aiText && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                                            AI {msg.model ? `(${msg.model})` : ''}:
                                                        </p>
                                                        <p className="text-sm text-gray-800 dark:text-low_text whitespace-pre-wrap">{msg.aiText}</p>
                                                    </div>
                                                )}
                                                {msg.imageUrl && (
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                                        <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                                                            Generated Image {msg.model ? `(${msg.model})` : ''}:
                                                        </p>
                                                        <img src={msg.imageUrl} alt="Generated" className="max-w-full rounded-lg" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Post Button */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handlePostConversation}
                                    disabled={isPosting}
                                    className="w-full py-3 bg-theme_color hover:bg-theme_color2 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPosting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Post Conversation
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create Community Modal */}
            {isCreating && (
                <NewTopicModal
                    onClose={() => {
                        setIsCreating(false);
                    }}
                />
            )}
        </>
    );
};

export default ShareConversationModal;
