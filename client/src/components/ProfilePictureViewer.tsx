import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, Trash2 } from "lucide-react";
import { getProfilePictureUrl, getUserInitials } from "../lib/utils";
import toast from "react-hot-toast";

interface ProfilePictureViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  user: {
    id: string;
    fullName: string | null;
    profilePicture: string | null | undefined;
  } | null;
}

const ProfilePictureViewer: React.FC<ProfilePictureViewerProps> = ({
  isOpen,
  onClose,
  onEdit,
  user,
}) => {
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemoveProfilePicture = async () => {
    if (!user) return;

    try {
      setIsRemoving(true);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/remove-profile-picture", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile picture removed successfully!");
        onClose();
        // Refresh the page to update all profile picture displays
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.message || "Failed to remove profile picture");
      }
    } catch (error) {
      console.error("Remove profile picture error:", error);
      toast.error("An error occurred while removing profile picture");
    } finally {
      setIsRemoving(false);
    }
  };

  const profilePictureUrl = getProfilePictureUrl(user?.profilePicture);
  const userInitials = getUserInitials(user?.fullName);

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Profile Picture</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Profile Picture Display */}
          <div className="flex justify-center mb-6">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-64 h-64 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200">
                <span className="text-6xl font-bold text-white">
                  {userInitials}
                </span>
              </div>
            )}
          </div>

          {/* User Name */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {user.fullName || "User"}
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            {profilePictureUrl && (
              <button
                onClick={handleRemoveProfilePicture}
                disabled={isRemoving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            )}
          </div>

          {/* Info Text */}
          {!profilePictureUrl && (
            <p className="text-center text-gray-500 text-sm mt-4">
              No profile picture set. Click Edit to upload one.
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfilePictureViewer;
