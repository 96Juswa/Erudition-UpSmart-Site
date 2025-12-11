import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  User,
  Calendar,
  FileText,
} from "lucide-react";

export default function ReportsManagementDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, report: null });
  const [actionType, setActionType] = useState("WARNING");
  const [resolution, setResolution] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(7);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url =
        filter === "PENDING"
          ? "/api/admin/reports/pending"
          : `/api/admin/reports?status=${filter}`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReview = async (reportId) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/review`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        fetchReports();
      } else {
        alert(data.message || "Failed to update report");
      }
    } catch (err) {
      alert("Failed to update report");
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert("Resolution notes are required");
      return;
    }

    if (
      (actionType === "WARNING" || actionType === "SUSPEND_USER") &&
      !reason.trim()
    ) {
      alert("Reason is required for warnings and suspensions");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports/${actionModal.report.id}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: actionType,
            resolution,
            reason,
            duration: actionType === "SUSPEND_USER" ? duration : null,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        closeActionModal();
        fetchReports();
      } else {
        alert(data.message || "Failed to resolve report");
      }
    } catch (err) {
      alert("Failed to resolve report");
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (report) => {
    setActionModal({ open: true, report });
    setActionType("WARNING");
    setResolution("");
    setReason("");
    setDuration(7);
  };

  const closeActionModal = () => {
    setActionModal({ open: false, report: null });
    setActionType("WARNING");
    setResolution("");
    setReason("");
    setDuration(7);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "DISMISSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "UNDER_REVIEW":
        return <Eye className="w-4 h-4" />;
      case "RESOLVED":
        return <CheckCircle className="w-4 h-4" />;
      case "DISMISSED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reports Management
          </h1>
          <p className="text-gray-600">Review and resolve user reports</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex gap-2 p-4 border-b border-gray-200">
            {["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    filter === status
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {getStatusIcon(status)}
                  {status.replace("_", " ")}
                </button>
              )
            )}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No reports found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {report.reportTitle}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(report.status)}`}
                          >
                            {getStatusIcon(report.status)}
                            {report.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {report.reportDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Reported User</p>
                          <p className="font-medium text-sm">
                            {report.reportedUser.firstName}{" "}
                            {report.reportedUser.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reportedUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Reporter</p>
                          <p className="font-medium text-sm">
                            {report.reporter.firstName}{" "}
                            {report.reporter.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reporter.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Report Date</p>
                          <p className="font-medium text-sm">
                            {new Date(report.reportDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(report.reportDate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {report.admin && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-900 font-medium">
                            Assigned to: {report.admin.firstName}{" "}
                            {report.admin.lastName}
                          </span>
                        </div>
                      </div>
                    )}

                    {report.resolution && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-green-600 mt-1" />
                          <div>
                            <p className="text-green-900 font-medium text-sm mb-1">
                              Resolution
                            </p>
                            <p className="text-green-700 text-sm">
                              {report.resolution}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {report.status === "PENDING" && (
                        <button
                          onClick={() => handleMarkAsReview(report.id)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Mark as Under Review
                        </button>
                      )}

                      {(report.status === "PENDING" ||
                        report.status === "UNDER_REVIEW") && (
                        <button
                          onClick={() => openActionModal(report)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve Report
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedReport(report)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h3 className="text-xl font-bold mb-4">Resolve Report</h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Report</p>
              <p className="font-medium">{actionModal.report?.reportTitle}</p>
              <p className="text-sm text-gray-600 mt-2">Reported User</p>
              <p className="font-medium">
                {actionModal.report?.reportedUser.firstName}{" "}
                {actionModal.report?.reportedUser.lastName}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action to Take
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WARNING">Warning</option>
                <option value="SUSPEND_USER">Suspend User</option>
                <option value="DELETE_CONTENT">Delete Content</option>
                <option value="DISMISS">Dismiss Report</option>
              </select>
            </div>

            {actionType === "SUSPEND_USER" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {(actionType === "WARNING" || actionType === "SUSPEND_USER") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (will be sent to user) *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes (internal) *
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter resolution details for admin records..."
                className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Resolve Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedReport.reportTitle}
                </h2>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit ${getStatusColor(selectedReport.status)}`}
                >
                  {getStatusIcon(selectedReport.status)}
                  {selectedReport.status.replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-red-200 p-2 rounded-lg">
                    <User className="w-5 h-5 text-red-700" />
                  </div>
                  <h3 className="font-semibold text-red-900">Reported User</h3>
                </div>
                <p className="font-medium text-lg mb-1">
                  {selectedReport.reportedUser.firstName}{" "}
                  {selectedReport.reportedUser.lastName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedReport.reportedUser.email}
                </p>
                <p className="text-xs text-gray-500">
                  User ID: {selectedReport.reportedUser.userId}
                </p>
              </div>

              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-200 p-2 rounded-lg">
                    <User className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-blue-900">Reporter</h3>
                </div>
                <p className="font-medium text-lg mb-1">
                  {selectedReport.reporter.firstName}{" "}
                  {selectedReport.reporter.lastName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedReport.reporter.email}
                </p>
                <p className="text-xs text-gray-500">
                  User ID: {selectedReport.reporter.userId}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Report Details</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Report ID</p>
                    <p className="font-medium">#{selectedReport.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Report Date</p>
                    <p className="font-medium">
                      {new Date(selectedReport.reportDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedReport.reportDescription}
                  </p>
                </div>
              </div>
            </div>

            {selectedReport.admin && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Admin Assignment
                  </h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium">
                    {selectedReport.admin.firstName}{" "}
                    {selectedReport.admin.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReport.admin.email}
                  </p>
                </div>
              </div>
            )}

            {selectedReport.resolution && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Resolution</h3>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedReport.resolution}
                  </p>
                </div>
              </div>
            )}

            {(selectedReport.status === "PENDING" ||
              selectedReport.status === "UNDER_REVIEW") && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedReport.status === "PENDING" && (
                  <button
                    onClick={() => {
                      handleMarkAsReview(selectedReport.id);
                      setSelectedReport(null);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium"
                  >
                    Mark as Under Review
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    openActionModal(selectedReport);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                >
                  Resolve Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
