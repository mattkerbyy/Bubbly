import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateShare } from "../../services/ShareFeature/shareService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AudienceSelector from "@/components/AudienceFeature/AudienceSelector";

export default function EditShareModal({ share, isOpen, onClose }) {
  const [caption, setCaption] = useState(share?.shareCaption || "");
  const [audience, setAudience] = useState(share?.audience || "Public");
  const queryClient = useQueryClient();

  const updateShareMutation = useMutation({
    mutationFn: (data) =>
      updateShare(share.id, data.shareCaption, data.audience),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share", share.id] });
      queryClient.invalidateQueries({ queryKey: ["userShares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Share updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update share");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateShareMutation.mutate({
      shareCaption: caption.trim() || null,
      audience,
    });
  };

  const handleCancel = () => {
    setCaption(share?.shareCaption || "");
    setAudience(share?.audience || "Public");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Share Caption</DialogTitle>
          <DialogDescription>
            Update the caption and privacy settings for your shared post
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Textarea
                placeholder="Add a caption to your share..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={280}
              />
              <div className="text-xs text-muted-foreground mt-1.5 text-right">
                {caption.length}/280
              </div>
            </div>

            {/* Audience Selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                Who can see this share?
              </label>
              <AudienceSelector
                value={audience}
                onChange={setAudience}
                disabled={updateShareMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateShareMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateShareMutation.isPending}>
              {updateShareMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
