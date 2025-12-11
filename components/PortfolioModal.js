'use client';

import { X } from 'lucide-react';

export default function PortfolioModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="relative bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {item.type === 'image' ? (
          <img
            src={item.url}
            alt="Portfolio"
            className="w-full h-auto rounded-lg"
          />
        ) : item.type === 'pdf' ? (
          <iframe
            src={item.url}
            className="w-full h-[80vh] rounded-lg"
            title="Portfolio PDF"
          />
        ) : (
          <p className="text-center text-gray-500">Unsupported file type</p>
        )}
      </div>
    </div>
  );
}
