import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { getPostShares } from "@/services/ShareFeature/shareService";
import { useNavigate } from "react-router-dom";
import { useFollowUser, useUnfollowUser } from "@/hooks/FollowFeature/useFollow";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

const PAGE_SIZE = 10;

export default function ShareListModal({ isOpen, onClose, postId }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["share-list", postId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPostShares(postId, pageParam, PAGE_SIZE);
      return {
        items: response.shares || [],
        pagination: {
          currentPage: response.currentPage || 1,
          hasMore: !!response.hasMore,
        },
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination?.hasMore) {
        return undefined;
      }
      return (lastPage.pagination.currentPage || 1) + 1;
    },
    enabled: isOpen && !!postId,
    staleTime: 30_000,
  });

  const shares = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items || []);
  }, [data]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    onClose?.();
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(userId);
      } else {
        await followMutation.mutateAsync(userId);
      }
    } catch (error) {
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-0">
        <AlertDialogHeader className="border-b p-4 pb-0">
          <div className="flex items-center justify-between pb-3">
            <AlertDialogTitle>Shares</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90 duration-300"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>

          {!isLoading && !isError && shares.length > 0 && (
            <Tabs value="All" className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-1">
                <TabsTrigger
                  value="All"
                  className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2.5"
                >
                  <span className="font-medium">All</span>
                  <span className="text-xs text-muted-foreground">
                    ({shares.length})
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </AlertDialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 px-4">
              <p className="text-destructive mb-4">
                {error?.response?.data?.error || "Failed to load shares"}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-12 px-4 text-muted-foreground">
              <p className="text-lg mb-1">📤</p>
              <p>No shares yet</p>
            </div>
          ) : (
            <div className="p-2">
              {shares.map((share) => {
                const isOwnProfile = currentUser?.id === share.user.id;
                const isFollowing = share.user.isFollowing;

                return (
                  <motion.div
                    key={share.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(share.user.username)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getImageUrl(share.user?.avatar)} />
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {getInitials(share.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm truncate">
                            {share.user?.name}
                          </p>
                          {share.user?.verified && (
                            <svg
                              className="h-4 w-4 text-primary flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{share.user?.username}
                        </p>
                      </div>
                    </div>

                    {!isOwnProfile && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          handleFollowToggle(share.user.id, isFollowing)
                        }
                        disabled={
                          followMutation.isPending || unfollowMutation.isPending
                        }
                        className={cn(
                          "ml-2 group",
                          isFollowing &&
                            "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                        )}
                      >
                        {isFollowing ? (
                          <>
                            <span className="group-hover:hidden">
                              Following
                            </span>
                            <span className="hidden group-hover:inline">
                              Unfollow
                            </span>
                          </>
                        ) : (
                          "Follow"
                        )}
                      </Button>
                    )}
                  </motion.div>
                );
              })}

              {hasNextPage && (
                <div className="flex justify-center py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="gap-2"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
