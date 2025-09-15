import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, UserPlus, Eye, EyeOff } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import toast from "react-hot-toast";
import { authAPI } from "../lib/api";

interface User {
  id: string;
  username: string;
  role: "ZONE_MANAGER" | "FIELD_OFFICER";
  createdAt: string;
}

export default function UserManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "FIELD_OFFICER" as "ZONE_MANAGER" | "FIELD_OFFICER",
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking permissions
    if (authLoading) return;

    if (user?.role !== "ZONE_MANAGER") {
      toast.error("Access denied: Zone Manager privileges required");
      return;
    }
    fetchUsers();
  }, [user, authLoading]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // We'll need to create this endpoint
      const response = await authAPI.getAllUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error("Username and password are required");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.createUser(formData);
      toast.success("User created successfully!");
      setFormData({ username: "", password: "", role: "FIELD_OFFICER" });
      setShowAddForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (
      !window.confirm(`Are you sure you want to delete user "${username}"?`)
    ) {
      return;
    }

    try {
      await authAPI.deleteUser(userId);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Show access denied only after auth has loaded and user is not zone manager
  if (user?.role !== "ZONE_MANAGER") {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You need zone manager privileges to access user management.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage system users and their access levels
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Add New User
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pr-10"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as
                          | "ZONE_MANAGER"
                          | "FIELD_OFFICER",
                      })
                    }
                  >
                    <option value="FIELD_OFFICER">Field Officer</option>
                    <option value="ZONE_MANAGER">Zone Manager</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Users List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              System Users
            </h2>
            <div className="text-sm text-gray-600">
              Total: {users.length} users
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner mr-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell text-left">Username</th>
                    <th className="table-cell text-center">Role</th>
                    <th className="table-cell text-center">Created</th>
                    <th className="table-cell text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData.id} className="lottery-brand-row">
                      <td className="table-cell font-medium">
                        {userData.username}
                      </td>
                      <td className="table-cell text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.role === "ZONE_MANAGER"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {userData.role === "ZONE_MANAGER"
                            ? "Zone Manager"
                            : "Field Officer"}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() =>
                              handleDeleteUser(userData.id, userData.username)
                            }
                            className="text-red-600 hover:text-red-800 p-1"
                            disabled={userData.id === user?.id}
                            title={
                              userData.id === user?.id
                                ? "Cannot delete your own account"
                                : "Delete user"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary mt-4 inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First User
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
