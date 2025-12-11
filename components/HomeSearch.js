import { Search } from "lucide-react";
import Button from "@/components/Button";

export default function HomeSearch() {
  return (
    <div className="flex items-center w-full border border-gray-300 rounded-md px-4 py-2 bg-white shadow-sm">
      {/* Lucide Search Icon */}
      <Search className="w-5 h-5 text-gray-500" />

      {/* Input Field */}
      <input
        type="text"
        placeholder="design, editing, tutoring..."
        className="flex-grow ml-3 bg-transparent focus:outline-none text-sm sm:text-base text-gray-700 placeholder:text-xs sm:placeholder:text-sm"
      />

      {/* Button */}
      <Button type="submit" variant="filled" color="primary">
        Find Service
      </Button>
    </div>
  );
}
