import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  User,
  Tag,
  ImageIcon,
} from "lucide-react";

export default function PortfolioApprovalDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    type: "",
    portfolio: null,
  });
  const [actionInput, setActionInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, [filter]);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const url =
        filter === "PENDING_APPROVAL"
          ? "/api/admin/portfolios/pending"
          : `/api/admin/portfolios?status=${filter}`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setPortfolios(data.portfolios || []);
    } catch (err) {
      console.error("Error fetching portfolios:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.portfolio) return;

    const { type, portfolio } = actionModal;

    if ((type === "decline" || type === "revision") && !actionInput.trim()) {
      alert(
        type === "decline"
          ? "Please provide a reason"
          : "Please provide revision notes"
      );
      return;
    }

    setActionLoading(true);
    try {
      const endpoint = `/api/admin/portfolios/${portfolio.id}/${
        type === "approve"
          ? "approve"
          : type === "decline"
            ? "decline"
            : "request-revision"
      }`;

      const body =
        type === "approve"
          ? { notes: actionInput }
          : type === "decline"
            ? { reason: actionInput }
            : { revisionNotes: actionInput };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        closeActionModal();
        fetchPortfolios();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (type, portfolio) => {
    setActionModal({ open: true, type, portfolio });
    setActionInput("");
  };

  const closeActionModal = () => {
    setActionModal({ open: false, type: "", portfolio: null });
    setActionInput("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portfolio Management
          </h1>
          <p className="text-gray-600">
            Review and approve portfolio submissions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex gap-2 p-4 border-b border-gray-200">
            {["PENDING_APPROVAL", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Loading portfolios...</p>
              </div>
            ) : portfolios.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No portfolios found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {portfolio.portfolioFiles[0] ? (
                        <img
                          src={portfolio.portfolioFiles[0].url}
                          alt={portfolio.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <span
                        className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(portfolio.status)}`}
                      >
                        {portfolio.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">
                        {portfolio.itemName}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          {portfolio.resolver.firstName}{" "}
                          {portfolio.resolver.lastName}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="w-4 h-4 mr-2" />
                          {portfolio.category.categoryName}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(portfolio.uploadDate).toLocaleDateString()}
                        </div>
                      </div>

                      {portfolio.revisionRequested && (
                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="font-semibold text-yellow-800">
                            Revision Requested
                          </p>
                          <p className="text-yellow-700">
                            {portfolio.revisionNotes}
                          </p>
                        </div>
                      )}

                      {portfolio.status === "PENDING_APPROVAL" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openActionModal("approve", portfolio)
                            }
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              openActionModal("decline", portfolio)
                            }
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedPortfolio(portfolio)}
                        className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {actionModal.type === "approve"
                ? "Approve Portfolio"
                : actionModal.type === "decline"
                  ? "Decline Portfolio"
                  : "Request Revision"}
            </h3>

            <p className="text-gray-600 mb-4">
              Portfolio: <strong>{actionModal.portfolio?.itemName}</strong>
            </p>

            <textarea
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder={
                actionModal.type === "approve"
                  ? "Optional notes..."
                  : actionModal.type === "decline"
                    ? "Reason for decline (required)"
                    : "Revision notes (required)"
              }
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3">
              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                  actionModal.type === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : actionModal.type === "decline"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedPortfolio.itemName}
                </h2>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedPortfolio.status)}`}
                >
                  {selectedPortfolio.status.replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => setSelectedPortfolio(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Resolver</p>
                <p className="font-medium">
                  {selectedPortfolio.resolver.firstName}{" "}
                  {selectedPortfolio.resolver.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedPortfolio.resolver.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">
                  {selectedPortfolio.category.categoryName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Upload Date</p>
                <p className="font-medium">
                  {new Date(selectedPortfolio.uploadDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Files</p>
                <p className="font-medium">
                  {selectedPortfolio.portfolioFiles.length} files
                </p>
              </div>
            </div>

            {selectedPortfolio.description && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-800">{selectedPortfolio.description}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Portfolio Files</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedPortfolio.portfolioFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {file.fileType.startsWith("image/") ? (
                      <img
                        src={file.url}
                        alt="Portfolio file"
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">{file.fileType}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedPortfolio.status === "PENDING_APPROVAL" && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedPortfolio(null);
                    openActionModal("approve", selectedPortfolio);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedPortfolio(null);
                    openActionModal("revision", selectedPortfolio);
                  }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => {
                    setSelectedPortfolio(null);
                    openActionModal("decline", selectedPortfolio);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
