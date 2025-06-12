import React from 'react';

const MasonryMediaGrid = ({ url, type }) => {
  const index ="jay";
        return (
          <div key={index} className="mb-4 break-inside-avoid rounded-lg overflow-hidden bg-white shadow-sm">
            {type === 'image' && (
              <img
                src={url}
                alt={`media-${index}`}
                className="w-full"
                loading="lazy"
              />
            )}

            {type === 'video' && (
              <video
                
                className="w-full"
                autoPlay
                loop
                muted
                playsInline
                // poster={item.thumbnail} // optional thumbnail
              >
                <source src={url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {type === 'audio' && (
              <div className="p-4">
                <audio controls className="w-full">
                  <source src={url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        );
};

export default MasonryMediaGrid;
