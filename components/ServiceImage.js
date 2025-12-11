"use client";

export default function ServiceImage({
  imageUrl,
  title,
  height = "h-full",
  rounded = "rounded-lg",
  className = "",
}) {
  return imageUrl ? (
    <img
      src={imageUrl}
      alt={title}
      className={`w-full object-cover ${height} ${rounded} ${className}`}
    />
  ) : (
    <div
      className={`w-full flex items-center justify-center bg-[#f4f9fd] text-[#094074] ${height} ${rounded} ${className}`}
    >
      <span className="text-lg font-bold">No Image Available</span>
    </div>
  );
}
