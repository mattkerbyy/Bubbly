import api from "@/lib/api";
export const toggleLike = async (postId) => {
  const response = await api.post(`/likes/posts/${postId}`);
  return response.data.data; // Extract data from { success, data } structure
};
export const getPostLikes = async (postId, page = 1, limit = 20) => {
  const response = await api.get(`/likes/posts/${postId}`, {
    params: { page, limit },
  });
  return response.data.data; // Extract data from { success, data } structure
};
export const checkUserLiked = async (postId) => {
  const response = await api.get(`/likes/posts/${postId}/check`);
  return response.data.data; // Extract data from { success, data } structure
};
export const getUserLikedPosts = async (userId, page = 1, limit = 10) => {
  const response = await api.get(`/likes/user/${userId}/liked`, {
    params: { page, limit },
  });
  return response.data; // Extract { success, data, pagination } structure
};

export default {
  toggleLike,
  getPostLikes,
  checkUserLiked,
  getUserLikedPosts,
};
