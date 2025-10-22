import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Users, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserCard from "@/components/Others/UserCard";
import Post from "@/components/PostFeature/Post";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResultsSkeleton } from "@/components/skeletons/SearchFeature/SearchSkeleton";
import {
  useSearchUsers,
  useSearchPosts,
} from "@/hooks/SearchFeature/useSearch";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All", icon: Search },
  { id: "users", label: "People", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
];

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all");
  const observerTarget = useRef(null);
  const {
    data: usersData,
    isLoading: usersLoading,
    fetchNextPage: fetchNextUsers,
    hasNextPage: hasMoreUsers,
    isFetchingNextPage: isFetchingMoreUsers,
  } = useSearchUsers(query, activeTab === "all" || activeTab === "users");

  const {
    data: postsData,
    isLoading: postsLoading,
    fetchNextPage: fetchNextPosts,
    hasNextPage: hasMorePosts,
    isFetchingNextPage: isFetchingMorePosts,
  } = useSearchPosts(query, activeTab === "all" || activeTab === "posts");
  const users = usersData?.pages?.flatMap((page) => page.data) || [];
  const posts = postsData?.pages?.flatMap((page) => page.data) || [];
  const totalUsers = usersData?.pages?.[0]?.pagination?.totalResults || 0;
  const totalPosts = postsData?.pages?.[0]?.pagination?.totalResults || 0;
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "users" && hasMoreUsers && !isFetchingMoreUsers) {
            fetchNextUsers();
          } else if (
            activeTab === "posts" &&
            hasMorePosts &&
            !isFetchingMorePosts
          ) {
            fetchNextPosts();
          } else if (activeTab === "all") {
            if (hasMoreUsers && !isFetchingMoreUsers) {
              fetchNextUsers();
            }
            if (hasMorePosts && !isFetchingMorePosts) {
              fetchNextPosts();
            }
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    activeTab,
    hasMoreUsers,
    hasMorePosts,
    isFetchingMoreUsers,
    isFetchingMorePosts,
    fetchNextUsers,
    fetchNextPosts,
  ]);

  const isLoading = usersLoading || postsLoading;
  const hasResults = users.length > 0 || posts.length > 0;

  if (!query) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Search Bubbly</h2>
            <p className="text-muted-foreground">
              Enter a search query to find people and posts
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">
                Search results for "{query}"
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>
                    {totalUsers} {totalUsers === 1 ? "person" : "people"} ·{" "}
                    {totalPosts} {totalPosts === 1 ? "post" : "posts"}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === "users"
                ? totalUsers
                : tab.id === "posts"
                ? totalPosts
                : totalUsers + totalPosts;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {!isLoading && count > 0 && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && (
          <SearchResultsSkeleton
            count={5}
            type={activeTab === "posts" ? "posts" : "users"}
          />
        )}

        {/* No Results */}
        {!isLoading && !hasResults && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching for something else or check your spelling
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasResults && (
          <div className="space-y-6">
            {/* All Tab - Show both users and posts */}
            {activeTab === "all" && (
              <>
                {users.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      People ({totalUsers})
                    </h2>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {users.slice(0, 3).map((user) => (
                          <UserCard key={user.id} user={user} />
                        ))}
                      </AnimatePresence>
                      {totalUsers > 3 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab("users")}
                        >
                          View all {totalUsers} people
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {users.length > 0 && posts.length > 0 && (
                  <Separator className="my-6" />
                )}

                {posts.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Posts ({totalPosts})
                    </h2>
                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {posts.slice(0, 3).map((post) => (
                          <Post key={post.id} post={post} />
                        ))}
                      </AnimatePresence>
                      {totalPosts > 3 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab("posts")}
                        >
                          View all {totalPosts} posts
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="flex justify-center py-8">
              {(isFetchingMoreUsers || isFetchingMorePosts) && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
            </div>

            {/* End of results */}
            {!hasMoreUsers &&
              !hasMorePosts &&
              ((activeTab === "users" && users.length > 5) ||
                (activeTab === "posts" && posts.length > 5) ||
                (activeTab === "all" &&
                  (users.length > 3 || posts.length > 3))) && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  You've reached the end of the results 🎉
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
