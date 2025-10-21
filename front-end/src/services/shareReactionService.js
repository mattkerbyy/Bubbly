import api from '../lib/api';

// Add or update reaction on a share
export const addShareReaction = async (shareId, reactionType) => {
  const response = await api.post(`/share-reactions/${shareId}/reactions`, {
    reactionType
  });
  return response.data;
};

// Remove reaction from a share
export const removeShareReaction = async (shareId) => {
  const response = await api.delete(`/share-reactions/${shareId}/reactions`);
  return response.data;
};

// Get all reactions for a share
export const getShareReactions = async (shareId, page = 1, limit = 20) => {
  const response = await api.get(`/share-reactions/${shareId}/reactions`, {
    params: { page, limit }
  });
  return response.data;
};
