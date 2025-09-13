import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Download, Filter } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { submissionsAPI } from "../lib/api";
import toast from "react-hot-toast";

interface Submission {
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

export default function Reports() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await submissionsAPI.getAll();
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">
              View and analyze sales submissions
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              All Submissions
            </h2>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button className="btn-secondary">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell text-left">Dealer</th>
                    <th className="table-cell text-left">Location</th>
                    <th className="table-cell text-center">Status</th>
                    <th className="table-cell text-center">Date</th>
                    <th className="table-cell text-center">Submitted By</th>
                    <th className="table-cell text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="lottery-brand-row">
                      <td className="table-cell font-medium">
                        {submission.dealerName}
                      </td>
                      <td className="table-cell">
                        {submission.district}, {submission.city}
                      </td>
                      <td className="table-cell text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.isDraft
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {submission.isDraft ? "Draft" : "Completed"}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-center">
                        {submission.user.username}
                      </td>
                      <td className="table-cell text-center">
                        <Link
                          to={`/submission?id=${submission.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No submissions found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
