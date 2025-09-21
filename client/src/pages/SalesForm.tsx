import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2, Eye, AlertTriangle, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { submissionsAPI } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  LOTTERY_BRANDS,
  DAYS_OF_WEEK,
  SALES_METHODS,
  VALIDATION_RULES,
  SRI_LANKA_DISTRICTS,
} from "../lib/constants";
import Layout from "../components/Layout";

const SalesForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const editId = searchParams.get("edit");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [customSalesMethod, setCustomSalesMethod] = useState("");
  
  // Navigation guard states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const originalFormDataRef = useRef<any>(null);
  
  const [formData, setFormData] = useState({
    id: "", // Add id field for updates
    district: user?.district || "",
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

  // Set user's district when user data loads
  useEffect(() => {
    if (user?.district && !editId) {
      setFormData((prev) => ({
        ...prev,
        district: user.district || "",
      }));
    }
  }, [user?.district, editId]);

  // Load draft for editing if editId is present
  useEffect(() => {
    if (editId) {
      loadDraftForEditing(editId);
    }
  }, [editId]);

  // Store original form data for comparison
  useEffect(() => {
    if (!originalFormDataRef.current) {
      originalFormDataRef.current = JSON.parse(JSON.stringify(formData));
    }
  }, [formData]);

  // Check for unsaved changes
  useEffect(() => {
    if (!originalFormDataRef.current) return;
    
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormDataRef.current);
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  // Navigation guard - intercept navigation attempts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept Link clicks and other navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;
      
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && !link.href.includes(location.pathname)) {
        e.preventDefault();
        e.stopPropagation();
        const href = new URL(link.href).pathname;
        setPendingNavigation(href);
        setShowNavigationWarning(true);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges, location.pathname]);

  // Handle navigation blocking for React Router navigation
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowNavigationWarning(true);
    } else {
      navigate(path);
    }
  };

  // Navigation warning dialog handlers
  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    originalFormDataRef.current = null;
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleSaveAsDraftAndNavigate = async () => {
    try {
      // Use the existing saveDraft function
      await handleSaveAsDraft();
      setHasUnsavedChanges(false);
      originalFormDataRef.current = JSON.parse(JSON.stringify(formData));
      setShowNavigationWarning(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
      }
    } catch (error) {
      // Error handling is already in handleSaveAsDraft function
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const loadDraftForEditing = async (id: string) => {
    try {
      setIsLoadingDraft(true);
      const response = await submissionsAPI.getById(id);
      const submission = response.data;

      // Check if it's actually a draft
      if (!submission.isDraft) {
        toast.error("Only draft submissions can be edited");
        return;
      }

      // Populate form with existing data
      setFormData({
        id: submission.id,
        district: submission.district || "",
        city: submission.city || "",
        dealerName: submission.dealerName || "",
        dealerNumber: submission.dealerNumber || "",
        assistantName: submission.assistantName || "",
        salesMethod: submission.salesMethod || "",
        salesLocation: submission.salesLocation || "",
        dailySales: LOTTERY_BRANDS.map((brand) => {
          const existingSale = submission.dailySales.find(
            (sale: any) => sale.brandName === brand
          );
          return (
            existingSale || {
              brandName: brand,
              monday: 0,
              tuesday: 0,
              wednesday: 0,
              thursday: 0,
              friday: 0,
              saturday: 0,
              sunday: 0,
            }
          );
        }),
      });

      // Handle custom sales method
      if (
        submission.salesMethod &&
        !SALES_METHODS.includes(submission.salesMethod)
      ) {
        setCustomSalesMethod(submission.salesMethod);
      }

      // Update original data reference for change detection
      setTimeout(() => {
        originalFormDataRef.current = JSON.parse(JSON.stringify(formData));
        setHasUnsavedChanges(false);
      }, 100);

      toast.success("Draft loaded for editing");
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error("Failed to load draft for editing");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericInputChange = (field: string, value: string) => {
    // Only allow numeric values and respect exact length for dealer number
    const numericValue = value.replace(/[^0-9]/g, "");
    const maxLength =
      field === "dealerNumber" ? VALIDATION_RULES.DEALER_NUMBER_LENGTH : 50;
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

    // Validate dealer number is exactly 6 digits
    if (
      formData.dealerNumber.length !== VALIDATION_RULES.DEALER_NUMBER_LENGTH
    ) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all required fields are filled
    if (!validateForm()) {
      if (
        formData.dealerNumber.length !== VALIDATION_RULES.DEALER_NUMBER_LENGTH
      ) {
        toast.error(
          `Dealer number must be exactly ${VALIDATION_RULES.DEALER_NUMBER_LENGTH} digits`
        );
      } else {
        toast.error("Please fill in all required fields");
      }
      return;
    }

    try {
      setIsLoading(true);

      if (formData.id) {
        // Update existing submission
        await submissionsAPI.update(formData.id, {
          ...formData,
          isDraft: false,
        });
        toast.success("Sales submission updated successfully!");
        // Reset unsaved changes state
        originalFormDataRef.current = null;
        setHasUnsavedChanges(false);
      } else {
        // Create new submission
        await submissionsAPI.create({
          ...formData,
          isDraft: false,
        });
        toast.success(
          "Sales submission created successfully! You can submit another one."
        );
        // Reset unsaved changes state
        originalFormDataRef.current = null;
        setHasUnsavedChanges(false);
      }

      // Reset form for next submission only if it was a new submission
      if (!formData.id) {
        setFormData({
          id: "",
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
      }
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

      // For drafts, allow minimal data - just ensure we have some basic info
      const draftData = {
        ...formData,
        // Provide defaults for required fields if empty
        district: formData.district || "",
        city: formData.city || "",
        dealerName: formData.dealerName || "",
        dealerNumber: formData.dealerNumber || "",
        assistantName: formData.assistantName || "",
        salesMethod: formData.salesMethod || "",
        salesLocation: formData.salesLocation || "",
        isDraft: true,
      };

      if (formData.id) {
        // Update existing draft
        await submissionsAPI.update(formData.id, draftData);
        toast.success("Draft updated successfully!");
        // Reset unsaved changes state
        originalFormDataRef.current = JSON.parse(JSON.stringify(formData));
        setHasUnsavedChanges(false);
      } else {
        // Create new draft
        const response = await submissionsAPI.create(draftData);
        // Update form with the new ID so subsequent saves are updates
        if (response.data.submission?.id) {
          setFormData((prev) => ({ ...prev, id: response.data.submission.id }));
        }
        toast.success("Draft saved successfully!");
        // Reset unsaved changes state
        originalFormDataRef.current = JSON.parse(JSON.stringify(formData));
        setHasUnsavedChanges(false);
      }
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
        id: "",
        district: user?.district || "",
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
      // Reset unsaved changes state
      originalFormDataRef.current = null;
      setHasUnsavedChanges(false);
      toast.success("Form cleared successfully");
    }
  };

  return (
    <Layout>
      {isLoadingDraft ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Loading draft for editing...
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {formData.id
                  ? "Edit Sales Submission"
                  : "Daily Sales Submission"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {formData.id
                  ? "Update your draft submission"
                  : "Submit your daily lottery sales data"}
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                General Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    District *
                    {user?.district && (
                      <span className="text-green-600 dark:text-green-400 text-xs ml-2">
                        (Your assigned district)
                      </span>
                    )}
                  </label>
                  <select
                    className={`input-field ${
                      user?.district && formData.district === user.district
                        ? "bg-green-50 border-green-300 dark:bg-green-900 dark:border-green-700"
                        : ""
                    }`}
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    required
                  >
                    <option value="">Select district</option>
                    {SRI_LANKA_DISTRICTS.map((district) => (
                      <option
                        key={district}
                        value={district}
                        className={
                          user?.district === district
                            ? "bg-green-100 font-medium dark:bg-green-800 dark:text-green-100"
                            : ""
                        }
                      >
                        {district}
                        {user?.district === district && " (Assigned)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                    maxLength={VALIDATION_RULES.DEALER_NUMBER_LENGTH}
                    placeholder="123456 (exactly 6 digits)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
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
                              value={
                                sale[day.toLowerCase() as keyof typeof sale]
                              }
                              onChange={(e) =>
                                handleSalesChange(
                                  index,
                                  day,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              onFocus={(e) => {
                                // Select all text when input is focused
                                e.target.select();
                              }}
                              onClick={(e) => {
                                // Also select all text when clicked
                                e.currentTarget.select();
                              }}
                            />
                          </td>
                        ))}
                        <td className="table-cell text-center font-semibold text-blue-600 dark:text-blue-400">
                          {calculateTotal(sale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
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
                            className="table-cell text-center text-blue-600 dark:text-blue-400"
                          >
                            {dayTotal}
                          </td>
                        );
                      })}
                      <td className="table-cell text-center text-blue-600 dark:text-blue-400 text-lg">
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
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isLoading
                  ? formData.id
                    ? "Updating..."
                    : "Submitting..."
                  : formData.id
                  ? "Update Submission"
                  : "Submit"}
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* Navigation Warning Modal */}
      <AnimatePresence>
        {showNavigationWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Unsaved Changes
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You have unsaved changes in your sales form. What would you like to do?
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleSaveAsDraftAndNavigate}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Save size={16} />
                  <span>Save as Draft & Continue</span>
                </button>

                <button
                  onClick={handleDiscardChanges}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Discard Changes</span>
                </button>

                <button
                  onClick={handleCancelNavigation}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default SalesForm;
