import { AlertTriangle, XCircle, Clock } from "lucide-react";

export default function SuspensionAlert({ suspension, onClose }) {
  if (!suspension) return null;

  const isPermanent = suspension.action === "PERMANENT_SUSPENSION";
  const endDate = suspension.endDate ? new Date(suspension.endDate) : null;
  const daysRemaining = endDate
    ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div
            className={`p-4 rounded-full ${
              isPermanent ? "bg-red-100" : "bg-orange-100"
            }`}
          >
            {isPermanent ? (
              <XCircle className="w-12 h-12 text-red-600" />
            ) : (
              <Clock className="w-12 h-12 text-orange-600" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
          Account Suspended
        </h2>

        <p className="text-center text-gray-600 mb-6">
          {isPermanent
            ? "Your account has been permanently suspended."
            : `Your account has been temporarily suspended for ${daysRemaining} more day${
                daysRemaining !== 1 ? "s" : ""
              }.`}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Reason for Suspension
          </h3>
          <p className="text-gray-700">{suspension.reason}</p>
        </div>

        {suspension.notes && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Additional Information
            </h3>
            <p className="text-gray-700 text-sm">{suspension.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Suspended On</p>
              <p className="font-medium text-gray-900">
                {new Date(suspension.startDate).toLocaleDateString()}
              </p>
            </div>
            {!isPermanent && endDate && (
              <div>
                <p className="text-gray-600">Ends On</p>
                <p className="font-medium text-gray-900">
                  {endDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {!isPermanent && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Your account will be automatically restored after the suspension
              period ends. Please review our community guidelines to avoid
              future violations.
            </p>
          </div>
        )}

        {isPermanent && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              If you believe this suspension was made in error, please contact
              our support team at{" "}
              <a
                href="mailto:support@erudition.com"
                className="text-blue-600 hover:underline"
              >
                support@erudition.com
              </a>
            </p>
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-6 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-medium transition"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
