import api from "../../lib/api";

/**
 * Search for users by name or username
 */
export const searchUsers = async (query, page = 1, limit = 10) => {
  const response = await api.get("/search/users", {
    params: { q: query, page, limit },
  });
  return response.data;
};

/**
 * Search for posts by content
 */
export const searchPosts = async (query, page = 1, limit = 10) => {
  const response = await api.get("/search/posts", {
    params: { q: query, page, limit },
  });
  return response.data;
};

/**
 * Search for both users and posts
 */
export const searchAll = async (query, limit = 5) => {
  const response = await api.get("/search/all", {
    params: { q: query, limit },
  });
  return response.data;
};
