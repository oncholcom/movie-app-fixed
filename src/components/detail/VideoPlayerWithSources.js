import React from 'react';
import VideoPlayer from './VideoPlayer'; // Your YouTube trailer player

const VideoPlayerWithSources = ({ 
  visible, 
  onClose, 
  movieId, 
  tvId, 
  season = 1, 
  episode = 1, 
  contentType = 'movie',
  title = '',
  isAnime = false,
  isTrailer = false,
  videoKey = null,
  navigation
}) => {
  // If it's a trailer, use the YouTube player
  if (isTrailer && videoKey) {
    return (
      <VideoPlayer
        visible={visible}
        videoKey={videoKey}
        onClose={onClose}
      />
    );
  }

  // For video content, navigate to separate screen
  if (visible && !isTrailer) {
    navigation.navigate('VideoPlayer', {
      movieId,
      tvId,
      season,
      episode,
      contentType,
      title,
      isAnime,
    });
    onClose(); // Close any existing modals
  }

  return null;
};

export default VideoPlayerWithSources;
