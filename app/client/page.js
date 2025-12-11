import { getCurrentUser } from "../lib/getCurrentUser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import TopProvidersSection from "@/components/TopProvidersSection";
import ServiceCarousel from "@/components/ServiceCarousel";

export default async function Client() {
  const user = await getCurrentUser();

  // Fetch all services (limit 10)
  const allRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/services?limit=10`,
    { cache: "no-store" }
  );
  const allServices = await allRes.json();

  // Mark top 4 as featured
  const featuredCount = 4;
  const servicesWithFeatured = allServices.map((service, index) => ({
    ...service,
    featured: index < featuredCount,
  }));

  // Only featured services for the Featured grid
  const featuredServices = servicesWithFeatured.filter(
    (service) => service.featured
  );

  // Top providers (static example data)
  const topProviders = {
    "Freelance Work": {
      name: "Jessa M.",
      profileImage: "/images/default-image.jpg",
      rating: 4.9,
    },
    "Creative Services": {
      name: "Alyssa R.",
      profileImage: "/images/default-image.jpg",
      rating: 5.0,
    },
    "Technical Services": {
      name: "Lance T.",
      profileImage: "/images/default-image.jpg",
      rating: 4.8,
    },
    "Educational Services": {
      name: "Nina V.",
      profileImage: "/images/default-image.jpg",
      rating: 4.9,
    },
    "Performing Arts": {
      name: "Carlos B.",
      profileImage: "/images/default-image.jpg",
      rating: 4.6,
    },
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-10">
        <Navbar user={user} />
        <div className="flex flex-col gap-5 py-6 sm:py-8 lg:py-10 px-0 sm:px-4 md:px-8 lg:px-12 xl:px-20">
          {/* Featured Services */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#094074] mb-2 sm:mb-4">
            <span className="text-[#c89933]">Featured</span> Services
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 justify-items-center w-full px-4 sm:px-0">
            {featuredServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.description}
                provider={service.provider}
                minPrice={service.minPrice}
                maxPrice={service.maxPrice}
                category={service.category}
                imageUrl={service.imageUrl}
                profileImageUrl={service.profileImageUrl}
                location={service.location}
                availability={service.availability}
                trustRating={service.trustRating}
                featured={service.featured}
                className="w-full max-w-[260px]"
              />
            ))}
          </div>

          {/* Top Providers */}

          {/* 
          <div className="mt-6 sm:mt-8 w-full">
            <TopProvidersSection providersByCategory={topProviders} />
          </div>
          Top Providers */}

          {/* Service Carousel */}
          <div className="mt-6 sm:mt-8 w-full">
            <ServiceCarousel allServices={servicesWithFeatured} />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-0">
        <Footer />
      </div>
    </div>
  );
}
