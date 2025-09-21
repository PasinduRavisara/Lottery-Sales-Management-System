import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  Trash2,
  Calendar,
  MapPin,
  User,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { submissionsAPI } from "../lib/api";
import { DAYS_OF_WEEK } from "../lib/constants";
import toast from "react-hot-toast";

interface Submission {
  id: string;
  district: string;
  city: string;
  dealerName: string;
  dealerNumber: string;
  assistantName: string;
  salesMethod: string;
  salesLocation: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    fullName: string;
  };
  dailySales: {
    brandName: string;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  }[];
}

export default function SubmissionDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setIsLoading(true);
      const response = await submissionsAPI.getById(id!);
      setSubmission(response.data);
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Failed to load submission details");
      navigate("/reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      await submissionsAPI.delete(id!);
      toast.success("Submission deleted successfully");
      navigate("/reports");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete submission");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotalTickets = (dailySales: any[]) => {
    return dailySales.reduce((total, sale) => {
      return (
        total +
        sale.monday +
        sale.tuesday +
        sale.wednesday +
        sale.thursday +
        sale.friday +
        sale.saturday +
        sale.sunday
      );
    }, 0);
  };

  const calculateBrandTotal = (sale: any) => {
    return (
      sale.monday +
      sale.tuesday +
      sale.wednesday +
      sale.thursday +
      sale.friday +
      sale.saturday +
      sale.sunday
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submission details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!submission) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Submission not found</p>
          <button
            onClick={() => navigate("/reports")}
            className="btn-primary mt-4"
          >
            Back to Reports
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Submission Details
              </h1>
              <p className="text-gray-600 mt-1">
                Submission #{submission.id.slice(-8)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {submission.isDraft ? (
                <Clock className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  submission.isDraft ? "text-orange-600" : "text-green-600"
                }`}
              >
                {submission.isDraft ? "Draft" : "Completed"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="btn-secondary flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>

              {user?.role === "TERRITORY_MANAGER" && (
                <button
                  onClick={handleDelete}
                  className="btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* General Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">District</p>
                  <p className="text-lg text-gray-900">{submission.district}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">City</p>
                  <p className="text-lg text-gray-900">{submission.city}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Dealer Name
                  </p>
                  <p className="text-lg text-gray-900">
                    {submission.dealerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Dealer Number
                  </p>
                  <p className="text-lg text-gray-900">
                    #{submission.dealerNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Assistant Name
                  </p>
                  <p className="text-lg text-gray-900">
                    {submission.assistantName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Sales Method
                  </p>
                  <p className="text-lg text-gray-900">
                    {submission.salesMethod}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-lg text-gray-900">
                    {new Date(submission.createdAt).toLocaleDateString()} at{" "}
                    {new Date(submission.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Submitted By
                  </p>
                  <p className="text-lg text-gray-900">
                    {submission.user.fullName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Sales Location
            </p>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {submission.salesLocation}
            </p>
          </div>
        </motion.div>

        {/* Daily Sales Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
            Daily Lottery Sales Quantity (Tickets)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-cell text-left">No</th>
                  <th className="table-cell text-left">Brand</th>
                  {DAYS_OF_WEEK.map((day: string) => (
                    <th
                      key={day}
                      className="table-cell text-center min-w-[100px]"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="table-cell text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {submission.dailySales.map((sale, index) => (
                  <tr key={sale.brandName} className="lottery-brand-row">
                    <td className="table-cell font-medium">{index + 1}</td>
                    <td className="table-cell font-medium">{sale.brandName}</td>
                    {DAYS_OF_WEEK.map((day: string) => (
                      <td key={day} className="table-cell text-center">
                        {sale[day.toLowerCase() as keyof typeof sale] as number}
                      </td>
                    ))}
                    <td className="table-cell text-center font-semibold text-blue-600">
                      {calculateBrandTotal(sale)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="table-cell" colSpan={2}>
                    Grand Total
                  </td>
                  {DAYS_OF_WEEK.map((day: string) => {
                    const dayTotal = submission.dailySales.reduce(
                      (total, sale) =>
                        total +
                        (sale[
                          day.toLowerCase() as keyof typeof sale
                        ] as number),
                      0
                    );
                    return (
                      <td
                        key={day}
                        className="table-cell text-center text-blue-600"
                      >
                        {dayTotal}
                      </td>
                    );
                  })}
                  <td className="table-cell text-center text-blue-600 text-lg">
                    {calculateTotalTickets(submission.dailySales)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {calculateTotalTickets(submission.dailySales).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Tickets Sold</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {submission.dailySales.length}
              </p>
              <p className="text-sm text-gray-600">Lottery Brands</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {Math.round(
                  calculateTotalTickets(submission.dailySales) /
                    submission.dailySales.length
                )}
              </p>
              <p className="text-sm text-gray-600">Average per Brand</p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
