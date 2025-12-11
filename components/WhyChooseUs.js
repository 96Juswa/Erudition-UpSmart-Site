import { PhilippinePeso, Users, Lightbulb, Star } from "lucide-react";

export default function WhyChooseUs() {
  return (
    <div className="bg-white py-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[#094074] mb-4">
          Why Choose Us?
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
          We’re more than just a marketplace—we’re a student-powered community
          built on collaboration, growth, and opportunity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
          {/* Benefit 1 */}
          <div className="flex flex-col items-start">
            <PhilippinePeso className="w-8 h-8 text-[#c89933] mb-3" />
            <h3 className="text-lg font-semibold text-[#094074]">
              Affordable Services
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Get quality help from fellow students at student-friendly rates.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="flex flex-col items-start">
            <Users className="w-8 h-8 text-[#c89933] mb-3" />
            <h3 className="text-lg font-semibold text-[#094074]">
              Peer-to-Peer Support
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Work with people who understand your needs—because they&apos;re
              students too.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="flex flex-col items-start">
            <Lightbulb className="w-8 h-8 text-[#c89933] mb-3" />
            <h3 className="text-lg font-semibold text-[#094074]">
              Skill Building
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Gain real-world experience and grow your portfolio while helping
              others.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="flex flex-col items-start">
            <Star className="w-8 h-8 text-[#c89933] mb-3" />
            <h3 className="text-lg font-semibold text-[#094074]">
              Trusted Community
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Built for and by JRU students—verified, safe, and supportive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
