import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, Download, Filter, Trash2, FileSpreadsheet } from "lucide-react";
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
    id: string;
    username: string;
  };
}

export default function Reports() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const handleDeleteSubmission = async (
    submissionId: string,
    dealerName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the submission for ${dealerName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await submissionsAPI.delete(submissionId);
      toast.success("Submission deleted successfully!");

      // Remove the deleted submission from the local state
      setSubmissions((prev) =>
        prev.filter((submission) => submission.id !== submissionId)
      );
    } catch (error: any) {
      console.error("Error deleting submission:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete submission"
      );
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      setIsExporting(true);
      setShowExportDropdown(false);

      const response = await fetch(`/api/reports/export?format=${format}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename =
        format === "excel"
          ? "lottery-sales-report.xlsx"
          : "lottery-sales-report.csv";

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} file downloaded successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
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
              {user?.role === "TERRITORY_MANAGER"
                ? "View and analyze all sales submissions"
                : "View and manage your sales submissions"}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.role === "TERRITORY_MANAGER"
                ? "All Submissions"
                : "My Submissions"}
            </h2>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>

              {/* Export Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export"}
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport("csv")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-3" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport("excel")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        disabled={isExporting}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-3" />
                        Export as Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    {user?.role === "TERRITORY_MANAGER" && (
                      <th className="table-cell text-center">Submitted By</th>
                    )}
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
                      {user?.role === "TERRITORY_MANAGER" && (
                        <td className="table-cell text-center">
                          {submission.user.username}
                        </td>
                      )}
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            to={`/submission?id=${submission.id}`}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View submission"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {/* Territory Managers can delete any submission, Sales Promotion Assistants can only delete their own */}
                          {(user?.role === "TERRITORY_MANAGER" ||
                            (user?.role === "SALES_PROMOTION_ASSISTANT" &&
                              submission.user.id === user.id)) && (
                            <button
                              onClick={() =>
                                handleDeleteSubmission(
                                  submission.id,
                                  submission.dealerName
                                )
                              }
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete submission"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
              <p className="text-gray-600">
                {user?.role === "TERRITORY_MANAGER"
                  ? "No submissions found"
                  : "You haven't submitted any reports yet"}
              </p>
              {user?.role === "SALES_PROMOTION_ASSISTANT" && (
                <Link
                  to="/sales-form"
                  className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Create your first submission
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
