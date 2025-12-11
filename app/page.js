import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCard";
import StepGuide from "@/components/StepGuide";
import CallToAction from "@/components/CallToAction";
import WhyChooseUs from "@/components/WhyChooseUs";
import Footer from "@/components/Footer";
import HomeContent from "@/components/HomeContent";
import { getCurrentUser } from "./lib/getCurrentUser";
import { Briefcase, PenTool, Code, BookOpen, Music } from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    return <HomeContent user={user} />;
  }

  return (
    <div className="w-full flex flex-col gap-10">
      {/* Navbar */}
      <div className="px-4 sm:px-6 md:px-10 pt-6 md:pt-10">
        <Navbar user={user} />
      </div>

      {/* Hero / Header Section */}
      <div className="px-0 sm:px-6 md:px-10">
        <Header />
      </div>

      {/* Service Categories */}
      <div className="flex flex-col px-4 sm:px-10 lg:px-20 py-20 md:py-20 gap-6 items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-center">
          SERVICE CATEGORIES
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 w-full justify-items-center">
          <CategoryCard
            title="Freelance Work"
            description="Marketing, admin tasks, and moderation by student freelancers."
            Icon={Briefcase}
          />
          <CategoryCard
            title="Creative Services"
            description="Writing, editing, and graphic design by student creatives."
            Icon={PenTool}
          />
          <CategoryCard
            title="Technical Services"
            description="From IT support to web dev—tech help from fellow students."
            Icon={Code}
          />
          <CategoryCard
            title="Educational Services"
            description="Tutoring, mentoring, and test prep from academic peers."
            Icon={BookOpen}
          />
          <CategoryCard
            title="Performing Arts"
            description="Music, theater, and dance instruction by talented students."
            Icon={Music}
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-[#094074] text-white py-12 sm:py-20">
        <div className="px-4 sm:px-10 flex flex-col gap-8 items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold">HOW IT WORKS</h1>
          <StepGuide />
        </div>
      </div>

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* CTA */}
      <CallToAction />

      {/* Footer */}
      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
