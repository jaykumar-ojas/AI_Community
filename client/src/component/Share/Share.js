import React from "react";
import {
  RedditIcon,
  TwitterIcon,
  WhatsAppIcon,
  DiscordIcon,
  LinkediIcon,
} from "../../asset/icons";
import { useNotification } from "../ContextProvider/NotificationContext";
import { decodeId, encodeId } from "../../utils/hashids";
const baseUrl = process.env.REACT_APP_BASE_URL;
const ShareButtons = ({ id, text, type }) => {
  // alert(id);
  const { showNotification } = useNotification();
  const shareUrl = `${baseUrl}/${type}/${encodeId(id)}`;
  // const shareUrl = `https://obstreperous-renetta-soupy.ngrok-free.dev/post/68d983362a25fac395480b70`;
  const encodedURL = encodeURIComponent(shareUrl);
  let message = "";

  switch (type) {
    case "post":
      message = `Hey, look what I generated:\n${text}`;
      break;
    case "forum":
      message = `Come join the discussion:\n${text}`;
      break;
    case "postThread":
      message = `I shared my thoughts:\n${text}`;
      break;
    case "forumThread":
      message = `Check out this thread:\n${text}`;
      break;
    default:
      message = text;
  }

  const encodedTitle = encodeURIComponent(message);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showNotification("Link copied to clipboard!", "success");
  };

  return (
    <div className="flex flex-row gap-3  items-center bg-white dark:bg-[#EDEDED]">
      {/* Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedURL}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-xs text-[#1DA1F2] rounded-full transform hover:scale-125 transition-transform transition-colors"
      >
        <TwitterIcon />
        <div className="hidden md:block">twitter</div>
      </a>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedURL}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-xs text-[#25D366] rounded-full transform hover:scale-125 transition-transform duration-200 transition-colors"
      >
        <WhatsAppIcon />
        <div className="hidden md:block">whatsapp</div>
      </a>

      {/* Reddit */}
      <a
        href={`https://www.reddit.com/submit?url=${encodedURL}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-xs text-[#FF4500] rounded-full transform hover:scale-125 transition-transform duration-200 transition-colors"
      >
        <RedditIcon />
        <div className="hidden md:block">reddit</div>
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedURL}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-xs text-[#0077B5] rounded-full transform hover:scale-125 transition-transform duration-200 transition-colors"
      >
        <LinkediIcon />
        <div className="hidden md:block">linkedin</div>
      </a>

      {/* Discord (copy link is safest) */}
      <button
        onClick={copyLink}
        className="flex flex-col items-center text-xs text-[#5865F2] rounded-full transform hover:scale-125 transition-transform duration-200 transition-colors"
      >
        <DiscordIcon />
        <div className="hidden md:block">discord</div>
      </button>

      {/* Copy Link */}
      <button
        onClick={copyLink}
        className="flex flex-col items-center text-xs text-gray-700 rounded-full transform hover:scale-125 transition-transform duration-200 transition-colors"
      >
        <div>🔗</div>
        <div className="hidden md:block">copy</div>
      </button>
    </div>
  );
};

export default ShareButtons;
