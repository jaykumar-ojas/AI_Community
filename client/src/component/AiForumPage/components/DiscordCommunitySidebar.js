import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Home, TrendingUp, Clock, User } from 'lucide-react';

const DiscordCommunitySidebar = ({ onTabChange, currentTab = 'popular', onCreateClick }) => {
  const navigate = useNavigate();

  const communityItems = [
    {
      id: 'popular',
      label: 'Popular',
      icon: TrendingUp,
      color: 'text-green-500',
      hoverColor: 'hover:bg-green-500/20',
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: Clock,
      color: 'text-blue-500',
      hoverColor: 'hover:bg-blue-500/20',
    },
    {
      id: 'my',
      label: 'My Topics',
      icon: User,
      color: 'text-purple-500',
      hoverColor: 'hover:bg-purple-500/20',
    },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
  };

  return (
    <div className="w-14 sm:w-16 md:w-16 lg:w-20 bg-gray-900 dark:bg-[#1e1f22] flex flex-col items-center py-2 sm:py-3 gap-1.5 sm:gap-2 border-r border-gray-800 dark:border-gray-700 flex-shrink-0">
      {/* Home/Community Icon */}
      <button
        onClick={() => navigate('/dashboard')}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-theme_color to-theme_color2 flex items-center justify-center text-white hover:rounded-lg sm:hover:rounded-xl transition-all duration-200 group relative"
        title="Home"
      >
        <Home className="w-5 h-5 sm:w-6 sm:h-6" />
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Home
        </div>
      </button>

      {/* Divider */}
      <div className="w-6 sm:w-8 h-0.5 bg-gray-700 dark:bg-gray-600 rounded-full my-0.5 sm:my-1"></div>

      {/* Community Items */}
      {communityItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isActive
                ? `${item.color} bg-gray-800 dark:bg-gray-700 rounded-lg sm:rounded-xl`
                : `text-gray-400 ${item.hoverColor} hover:text-white`
            }`}
            title={item.label}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            
            {/* Active indicator bar */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 sm:w-1 h-6 sm:h-8 bg-white rounded-r-full"></div>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.label}
            </div>
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-6 sm:w-8 h-0.5 bg-gray-700 dark:bg-gray-600 rounded-full my-0.5 sm:my-1"></div>

      {/* Add Community Button */}
      <button
        onClick={onCreateClick}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-800 dark:bg-gray-700 text-gray-400 hover:text-green-500 hover:bg-green-500/20 flex items-center justify-center transition-all duration-200 group relative"
        title="Create Discussion"
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Create Discussion
        </div>
      </button>
    </div>
  );
};

export default DiscordCommunitySidebar;

