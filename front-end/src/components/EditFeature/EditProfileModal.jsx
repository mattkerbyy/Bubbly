import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useUpdateProfile } from "@/hooks/UserFeature/useUsers";
import { deleteAccount } from "@/services/UserFeature/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function EditProfileModal({ isOpen, onClose, profile }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const updateProfileMutation = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });

  const [errors, setErrors] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.name && formData.name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters";
    }

    if (formData.location && formData.location.length > 100) {
      newErrors.location = "Location cannot exceed 100 characters";
    }

    if (formData.website) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website =
          "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(formData);
      onClose();
    } catch (error) {
    }
  };

  const handleClose = () => {
    if (!updateProfileMutation.isPending) {
      onClose();
      setTimeout(() => {
        setErrors({});
      }, 300);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success("Your account has been deleted");
      logout();
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              maxLength={100}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.name}
              </motion.p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              Bio
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows={4}
              maxLength={500}
              className={errors.bio ? "border-destructive" : ""}
            />
            {errors.bio && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.bio}
              </motion.p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Where are you from?"
              maxLength={100}
              className={errors.location ? "border-destructive" : ""}
            />
            {errors.location && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.location}
              </motion.p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium">
              Website
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              className={errors.website ? "border-destructive" : ""}
            />
            {errors.website && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.website}
              </motion.p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="min-w-[100px]"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-6 pt-6 border-t border-destructive/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Danger Zone</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={updateProfileMutation.isPending}
              className="w-full sm:w-auto"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will
                permanently delete your account and remove all your data from
                our servers.
              </p>
              <p>
                All your posts, comments, reactions, and messages will be
                permanently deleted.
              </p>
              <div className="pt-4">
                <Label htmlFor="delete-password" className="text-foreground">
                  Enter your password to confirm
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="delete-password"
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    className="pr-10"
                    disabled={isDeleting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showDeletePassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletePassword("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!deletePassword || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete My Account"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
