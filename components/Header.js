import HomeSearch from "@/components/HomeSearch";

export default function Header() {
  return (
    <div className="relative w-full">
      <img
        className="object-cover object-top h-[400px] sm:h-[600px] md:h-[800px] w-full z-0"
        src="/images/jru-student-3.jpg"
        alt="JRU Students"
      />

      <div className="absolute inset-0 bg-black/40"></div>

      <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-10 md:px-20 gap-2 pb-2">
        <div className="flex flex-col text-white">
          <h1 className="text-3xl sm:text-4xl md:text-6xl">
            Find a <span className="text-[#c89933]">service</span> for you.
          </h1>
          <p className="text-sm sm:text-base md:text-lg">
            A marketplace built by students, for students. Find the right peer
            to help you study smarter, create better, or get things done.
          </p>
        </div>
        {/*<HomeSearch />*/}
      </div>
    </div>
  );
}
