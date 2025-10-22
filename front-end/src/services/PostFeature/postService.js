import api from "@/lib/api";

export const postService = {
  getPosts: async ({ page = 1, limit = 10 }) => {
    const { data } = await api.get(`/posts?page=${page}&limit=${limit}`);
    return data;
  },
  getPostById: async (postId) => {
    const { data } = await api.get(`/posts/${postId}`);
    return data;
  },
  getUserPosts: async (userId, { page = 1, limit = 10 }) => {
    const { data } = await api.get(
      `/posts/user/${userId}?page=${page}&limit=${limit}`
    );
    return data;
  },
  createPost: async (postData) => {
    if (postData instanceof FormData) {
      const { data } = await api.post("/posts", postData);
      return data;
    }
    const formData = new FormData();
    formData.append("content", postData.content);

    if (postData.image) {
      formData.append("image", postData.image);
    }
    const { data } = await api.post("/posts", formData);
    return data;
  },
  updatePost: async (postId, postData) => {
    const { data } = await api.put(`/posts/${postId}`, postData);
    return data;
  },
  deletePost: async (postId) => {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
  },
  deleteShare: async (postId) => {
    const { data } = await api.delete(`/shares/${postId}`);
    return data;
  },
};
