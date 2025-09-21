import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  Edit3,
  MapPin,
  Shield,
  AtSign,
  X,
  ChevronDown,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import ProfilePictureUpload from "../components/ProfilePictureUpload";

// Sri Lankan Districts
const SRI_LANKAN_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    district: user?.district || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showProfilePictureUpload, setShowProfilePictureUpload] =
    useState(false);

  // Update form data when user data changes (e.g., after login)
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        district: user.district || "",
      }));
    }
  }, [user]);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureUpload = (newPictureUrl: string) => {
    // Update the user context with the new profile picture
    updateUser({
      ...user!,
      profilePicture: newPictureUrl,
    });
  };

  const updateProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          district: profileData.district,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data.user);
        showNotification("success", "Profile updated successfully!");
      } else {
        showNotification("error", data.error || "Failed to update profile");
      }
    } catch (error) {
      showNotification("error", "An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      showNotification("error", "New passwords do not match");
      return;
    }

    if (profileData.newPassword.length < 6) {
      showNotification("error", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfileData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setShowPasswordForm(false);
        showNotification("success", "Password changed successfully!");
      } else {
        showNotification("error", data.error || "Failed to change password");
      }
    } catch (error) {
      showNotification("error", "An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                  notification.type === "success"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {notification.type === "success" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span>{notification.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your account settings and preferences
            </p>
          </motion.div>

          {/* Profile Picture Card - Centered */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="relative inline-block mb-6">
                  <div className="relative w-32 h-32 mx-auto">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-blue-400"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                        {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <button
                      onClick={() => setShowProfilePictureUpload(true)}
                      className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors shadow-lg"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {user?.fullName}
                </h2>
                <p className="text-gray-600 mb-4">{user?.district}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Shield size={16} />
                    <span className="capitalize">{user?.role}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <AtSign size={16} />
                    <span>{user?.username}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Profile Information and Security Cards - Centered and Stacked */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Profile Information
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-semibold text-gray-700 mb-3"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-12"
                        placeholder="Enter your full name"
                      />
                      <User
                        className="absolute left-4 top-3.5 text-gray-400"
                        size={20}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="district"
                      className="block text-sm font-semibold text-gray-700 mb-3"
                    >
                      District
                    </label>
                    <div className="relative">
                      <select
                        id="district"
                        name="district"
                        value={profileData.district}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-12 pr-10 appearance-none bg-white"
                      >
                        <option value="">Select a district</option>
                        {SRI_LANKAN_DISTRICTS.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      <MapPin
                        className="absolute left-4 top-3.5 text-gray-400"
                        size={20}
                      />
                      <ChevronDown
                        className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"
                        size={20}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={updateProfile}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <Save size={20} />
                    <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Lock className="text-red-600" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Security Settings
                    </h3>
                  </div>

                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Edit3 size={16} />
                      <span>Change Password</span>
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showPasswordForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-semibold text-gray-700 mb-3"
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={profileData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="newPassword"
                            className="block text-sm font-semibold text-gray-700 mb-3"
                          >
                            New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={profileData.newPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-semibold text-gray-700 mb-3"
                          >
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={profileData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setProfileData((prev) => ({
                              ...prev,
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            }));
                          }}
                          className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                        >
                          <X size={20} />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={changePassword}
                          disabled={isLoading}
                          className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          <Lock size={20} />
                          <span>
                            {isLoading ? "Changing..." : "Change Password"}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="text-gray-500 mb-4">
                        <Lock size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Your password is secure</p>
                        <p className="text-sm">
                          Click "Change Password" to update your security
                          credentials
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <ProfilePictureUpload
        isOpen={showProfilePictureUpload}
        onClose={() => setShowProfilePictureUpload(false)}
        onUploadSuccess={handleProfilePictureUpload}
      />
    </Layout>
  );
}
