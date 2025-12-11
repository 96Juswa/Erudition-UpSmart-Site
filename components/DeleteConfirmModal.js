"use client";

import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center space-y-6 animate-fade-in">
        <div className="flex flex-col items-center space-y-2">
          <AlertTriangle className="text-red-600 w-12 h-12" />
          <h3 className="text-xl font-bold text-gray-800">Are you sure?</h3>
          <p className="text-sm text-gray-600">
            This action will permanently delete the listing. You can’t undo
            this.
          </p>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
