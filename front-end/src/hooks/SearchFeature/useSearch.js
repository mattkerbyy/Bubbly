import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import * as searchService from "../../services/SearchFeature/searchService";

/**
 * Hook to search users with pagination
 */
export const useSearchUsers = (query, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ["search", "users", query],
    queryFn: ({ pageParam = 1 }) =>
      searchService.searchUsers(query, pageParam, 10),
    getNextPageParam: (lastPage) => {
      const { currentPage, hasMore } = lastPage.pagination;
      return hasMore ? currentPage + 1 : undefined;
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to search posts with pagination
 */
export const useSearchPosts = (query, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ["search", "posts", query],
    queryFn: ({ pageParam = 1 }) =>
      searchService.searchPosts(query, pageParam, 10),
    getNextPageParam: (lastPage) => {
      const { currentPage, hasMore } = lastPage.pagination;
      return hasMore ? currentPage + 1 : undefined;
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to search all content (users and posts) - for quick preview
 */
export const useSearchAll = (query, enabled = true) => {
  return useQuery({
    queryKey: ["search", "all", query],
    queryFn: () => searchService.searchAll(query, 5),
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
