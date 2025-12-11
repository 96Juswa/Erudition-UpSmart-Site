"use client";

import CategoryCard from "@/components/CategoryCard";
import { Briefcase, PenTool, Code, BookOpen, Music } from "lucide-react";
import LogoText from "@/components/LogoText";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
  const router = useRouter();

  const categories = [
    {
      title: "Freelance Work",
      description:
        "Marketing, admin tasks, and moderation by student freelancers.",
      Icon: Briefcase,
    },
    {
      title: "Creative Services",
      description: "Writing, editing, and graphic design by student creatives.",
      Icon: PenTool,
    },
    {
      title: "Technical Services",
      description: "From IT support to web dev—tech help from fellow students.",
      Icon: Code,
    },
    {
      title: "Educational Services",
      description: "Tutoring, mentoring, and test prep from academic peers.",
      Icon: BookOpen,
    },
    {
      title: "Performing Arts",
      description:
        "Music, theater, and dance instruction by talented students.",
      Icon: Music,
    },
  ];

  return (
    <div className="min-h-screen p-5 sm:p-10 bg-gray-50">
      <div className="flex flex-col items-center mb-8">
        <LogoText />
        <h1 className="text-2xl sm:text-3xl font-bold mt-4 text-center">
          Explore Categories
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mt-2 max-w-xl">
          Browse through the various categories of services offered by our
          talented students.
        </p>
      </div>

      <div className="grid gap-5 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.title}
            title={cat.title}
            description={cat.description}
            Icon={cat.Icon}
          />
        ))}
      </div>
    </div>
  );
}
