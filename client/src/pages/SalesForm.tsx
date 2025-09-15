import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import { submissionsAPI } from "../lib/api";
import {
  LOTTERY_BRANDS,
  DAYS_OF_WEEK,
  SALES_METHODS,
  VALIDATION_RULES,
  SRI_LANKA_DISTRICTS,
} from "../lib/constants";
import Layout from "../components/Layout";

const SalesForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [customSalesMethod, setCustomSalesMethod] = useState("");
  const [formData, setFormData] = useState({
    district: "",
    city: "",
    dealerName: "",
    dealerNumber: "",
    assistantName: "",
    salesMethod: "",
    salesLocation: "",
    dailySales: LOTTERY_BRANDS.map((brand) => ({
      brandName: brand,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    })),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericInputChange = (field: string, value: string) => {
    // Only allow numeric values and respect max length for dealer number
    const numericValue = value.replace(/[^0-9]/g, "");
    const maxLength =
      field === "dealerNumber" ? VALIDATION_RULES.MAX_DEALER_NUMBER_LENGTH : 50;
    const truncatedValue = numericValue.slice(0, maxLength);

    setFormData((prev) => ({
      ...prev,
      [field]: truncatedValue,
    }));
  };

  const handleSalesChange = (
    brandIndex: number,
    day: string,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      dailySales: prev.dailySales.map((sale, index) =>
        index === brandIndex ? { ...sale, [day.toLowerCase()]: value } : sale
      ),
    }));
  };

  const handleSalesMethodChange = (value: string) => {
    setFormData((prev) => ({ ...prev, salesMethod: value }));
    if (value !== "Other") {
      setCustomSalesMethod("");
    }
  };

  const handleCustomSalesMethodChange = (value: string) => {
    setCustomSalesMethod(value);
    setFormData((prev) => ({ ...prev, salesMethod: value }));
  };

  const calculateTotal = (sales: any) => {
    return (
      sales.monday +
      sales.tuesday +
      sales.wednesday +
      sales.thursday +
      sales.friday +
      sales.saturday +
      sales.sunday
    );
  };

  const calculateGrandTotal = () => {
    return formData.dailySales.reduce(
      (total, sale) => total + calculateTotal(sale),
      0
    );
  };

  const validateForm = () => {
    const requiredFields = [
      "district",
      "city",
      "dealerName",
      "dealerNumber",
      "assistantName",
      "salesMethod",
      "salesLocation",
    ];

    for (const field of requiredFields) {
      if (
        !formData[field as keyof typeof formData] ||
        (formData[field as keyof typeof formData] as string).trim() === ""
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      await submissionsAPI.create({
        ...formData,
        isDraft: false,
      });

      toast.success(
        "Sales submission created successfully! You can submit another one."
      );

      // Reset form for next submission
      setFormData({
        district: "",
        city: "",
        dealerName: "",
        dealerNumber: "",
        assistantName: "",
        salesMethod: "",
        salesLocation: "",
        dailySales: LOTTERY_BRANDS.map((brand) => ({
          brandName: brand,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        })),
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit sales data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      setIsLoading(true);
      await submissionsAPI.create({
        ...formData,
        isDraft: true,
      });

      toast.success("Draft saved successfully!");
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear all form data?")) {
      setFormData({
        district: "",
        city: "",
        dealerName: "",
        dealerNumber: "",
        assistantName: "",
        salesMethod: "",
        salesLocation: "",
        dailySales: LOTTERY_BRANDS.map((brand) => ({
          brandName: brand,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        })),
      });
      setCustomSalesMethod("");
      toast.success("Form cleared successfully");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Daily Sales Submission
            </h1>
            <p className="text-gray-600 mt-1">
              Submit your daily lottery sales data
            </p>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {/* General Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              General Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <select
                  className="input-field"
                  value={formData.district}
                  onChange={(e) =>
                    handleInputChange("district", e.target.value)
                  }
                  required
                >
                  <option value="">Select district</option>
                  {SRI_LANKA_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dealer Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.dealerName}
                  onChange={(e) =>
                    handleInputChange("dealerName", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dealer Number *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.dealerNumber}
                  onChange={(e) =>
                    handleNumericInputChange("dealerNumber", e.target.value)
                  }
                  onKeyPress={(e) => {
                    // Allow: numbers (0-9)
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, home, end, arrow keys
                    if (
                      [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(
                        e.keyCode
                      ) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (e.keyCode === 65 && e.ctrlKey === true) ||
                      (e.keyCode === 67 && e.ctrlKey === true) ||
                      (e.keyCode === 86 && e.ctrlKey === true) ||
                      (e.keyCode === 88 && e.ctrlKey === true)
                    ) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if (
                      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                      (e.keyCode < 96 || e.keyCode > 105)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={VALIDATION_RULES.MAX_DEALER_NUMBER_LENGTH}
                  placeholder="e.g., 1223242352"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistant Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.assistantName}
                  onChange={(e) =>
                    handleInputChange("assistantName", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Method *
                </label>
                <select
                  className="input-field"
                  value={
                    SALES_METHODS.includes(formData.salesMethod)
                      ? formData.salesMethod
                      : "Other"
                  }
                  onChange={(e) => handleSalesMethodChange(e.target.value)}
                  required
                >
                  <option value="">Select method</option>
                  {SALES_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                {(formData.salesMethod === "Other" ||
                  !SALES_METHODS.includes(formData.salesMethod)) && (
                  <input
                    type="text"
                    className="input-field mt-2"
                    placeholder="Please specify..."
                    value={
                      formData.salesMethod === "Other"
                        ? customSalesMethod
                        : formData.salesMethod
                    }
                    onChange={(e) =>
                      handleCustomSalesMethodChange(e.target.value)
                    }
                    required
                  />
                )}
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Location *
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.salesLocation}
                onChange={(e) =>
                  handleInputChange("salesLocation", e.target.value)
                }
                required
              />
            </div>
          </div>

          {/* Daily Sales Table */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
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
                  {formData.dailySales.map((sale, index) => (
                    <tr key={sale.brandName} className="lottery-brand-row">
                      <td className="table-cell font-medium">{index + 1}</td>
                      <td className="table-cell font-medium">
                        {sale.brandName}
                      </td>
                      {DAYS_OF_WEEK.map((day: string) => (
                        <td key={day} className="table-cell text-center">
                          <input
                            type="number"
                            min="0"
                            className="lottery-input"
                            value={sale[day.toLowerCase() as keyof typeof sale]}
                            onChange={(e) =>
                              handleSalesChange(
                                index,
                                day,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="table-cell text-center font-semibold text-blue-600">
                        {calculateTotal(sale)}
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
                      const dayTotal = formData.dailySales.reduce(
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
                      {calculateGrandTotal()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearForm}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Form
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSaveAsDraft}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save as Draft"}
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </motion.form>
      </div>
    </Layout>
  );
};

export default SalesForm;
