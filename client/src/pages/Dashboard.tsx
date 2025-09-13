import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { reportsAPI } from "../lib/api";
import Layout from "../components/Layout";
import toast from "react-hot-toast";

interface DashboardStats {
  totalSubmissions: number;
  thisWeekSubmissions: number;
  thisMonthSubmissions: number;
  draftSubmissions: number;
}

interface RecentSubmission {
  id: string;
  dealerName: string;
  district: string;
  city: string;
  isDraft: boolean;
  createdAt: string;
  user: {
    username: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    thisWeekSubmissions: 0,
    thisMonthSubmissions: 0,
    draftSubmissions: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<
    RecentSubmission[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await reportsAPI.getDashboard();
      const { stats: dashboardStats, recentSubmissions: recent } =
        response.data;

      setStats(dashboardStats);
      setRecentSubmissions(recent);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Submissions",
      value: stats.totalSubmissions.toLocaleString(),
      icon: FileText,
      color: "blue",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "This Week",
      value: stats.thisWeekSubmissions.toLocaleString(),
      icon: Calendar,
      color: "green",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "This Month",
      value: stats.thisMonthSubmissions.toLocaleString(),
      icon: TrendingUp,
      color: "purple",
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "Drafts",
      value: stats.draftSubmissions.toLocaleString(),
      icon: Clock,
      color: "orange",
      change: "-3%",
      changeType: "negative",
    },
  ];

  const quickActions = [
    {
      title: "New Sales Submission",
      description: "Create a new daily sales submission",
      href: "/sales-form",
      icon: Plus,
      color: "blue",
    },
    {
      title: "View Reports",
      description: "Analyze sales data and generate reports",
      href: "/reports",
      icon: BarChart3,
      color: "green",
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.username}! Here's your sales overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <p
                      className={`text-sm ${
                        card.changeType === "positive"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {card.change} from last period
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-${card.color}-100`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-full bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors duration-200`}
                    >
                      <Icon className={`h-6 w-6 text-${action.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Submissions
            </h2>
            <Link
              to="/reports"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all
            </Link>
          </div>

          {recentSubmissions.length > 0 ? (
            <div className="space-y-4">
              {recentSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {submission.isDraft ? (
                        <Clock className="h-5 w-5 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {submission.dealerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {submission.district}, {submission.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.isDraft
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {submission.isDraft ? "Draft" : "Completed"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {submission.user.username}
                      </p>
                    </div>
                    <Link
                      to={`/submission?id=${submission.id}`}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submissions yet</p>
              <Link
                to="/sales-form"
                className="btn-primary mt-4 inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Submission
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
