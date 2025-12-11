export default function CategoryCard({ title, description, Icon }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
      <div className="bg-[#e6eef7] text-[#094074] p-3 rounded-full mb-4">
        <Icon className="w-6 h- text-[#c89933]" />
      </div>
      <h3 className="text-lg font-semibold text-[#094074]">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
}
