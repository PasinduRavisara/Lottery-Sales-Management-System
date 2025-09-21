import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  UserPlus,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { SRI_LANKA_DISTRICTS } from "../lib/constants";
import toast from "react-hot-toast";
import { authAPI } from "../lib/api";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: "TERRITORY_MANAGER" | "SALES_PROMOTION_ASSISTANT";
  district?: string;
  createdAt: string;
}

type SortField = "role" | "district" | "createdAt";
type SortDirection = "asc" | "desc";

export default function UserManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "SALES_PROMOTION_ASSISTANT" as
      | "TERRITORY_MANAGER"
      | "SALES_PROMOTION_ASSISTANT",
    district: "",
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking permissions
    if (authLoading) return;

    if (user?.role !== "TERRITORY_MANAGER") {
      toast.error("Access denied: Territory Manager privileges required");
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

    if (
      !formData.username.trim() ||
      !formData.fullName.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Username, full name, and password are required");
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
      setFormData({
        username: "",
        fullName: "",
        password: "",
        role: "SALES_PROMOTION_ASSISTANT",
        district: "",
      });
      setShowAddForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (
      !window.confirm(`Are you sure you want to delete user "${fullName}"?`)
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

  // Sorting functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort users based on current sort field and direction
  const sortedUsers = useMemo(() => {
    if (!sortField) return users;

    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "district":
          aValue = a.district || "";
          bValue = b.district || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortField, sortDirection]);

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

  // Show access denied only after auth has loaded and user is not territory manager
  if (user?.role !== "TERRITORY_MANAGER") {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You need territory manager privileges to access user management.
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Add New User
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                    placeholder="e.g., john_doe"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Username for login only
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                    placeholder="e.g., John Doe"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Display name for the system
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Role *
                  </label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as
                          | "TERRITORY_MANAGER"
                          | "SALES_PROMOTION_ASSISTANT",
                      })
                    }
                  >
                    <option value="SALES_PROMOTION_ASSISTANT">
                      Sales Promotion Assistant
                    </option>
                    <option value="TERRITORY_MANAGER">Territory Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Assigned District (Optional)
                  </label>
                  <select
                    className="input-field"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        district: e.target.value,
                      })
                    }
                  >
                    <option value="">No specific district</option>
                    {SRI_LANKA_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Users
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total: {users.length} users
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner mr-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Loading users...
              </p>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell text-left">Full Name</th>
                    <th
                      className="table-cell text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleSort("role")}
                      title="Click to sort by role"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Role</span>
                        {sortField === "role" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          )
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-400 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th
                      className="table-cell text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleSort("district")}
                      title="Click to sort by district"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>District</span>
                        {sortField === "district" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          )
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-400 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th
                      className="table-cell text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleSort("createdAt")}
                      title="Click to sort by creation date"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Created</span>
                        {sortField === "createdAt" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          )
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-400 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th className="table-cell text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((userData) => (
                    <tr key={userData.id} className="lottery-brand-row">
                      <td className="table-cell font-medium">
                        {userData.fullName}
                      </td>
                      <td className="table-cell text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.role === "TERRITORY_MANAGER"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {userData.role === "TERRITORY_MANAGER"
                            ? "Territory Manager"
                            : "Sales Promotion Assistant"}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {userData.district || "Not assigned"}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {userData.role === "SALES_PROMOTION_ASSISTANT" &&
                          userData.id !== user?.id ? (
                            <button
                              onClick={() =>
                                handleDeleteUser(userData.id, userData.fullName)
                              }
                              className="text-red-600 hover:text-red-800 p-1 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span
                              className="text-gray-400 p-1 cursor-not-allowed"
                              title={
                                userData.id === user?.id
                                  ? "Cannot delete your own account"
                                  : userData.role === "TERRITORY_MANAGER"
                                  ? "Cannot delete other territory managers"
                                  : "Action not available"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">No users found</p>
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
