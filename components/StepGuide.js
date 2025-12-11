import {
  UserPlus,
  Search,
  MessageCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function StepGuide() {
  return (
    <div>
      <div className="hidden lg:flex items-center justify-between gap-6">
        {/* Step 1 */}
        <Step
          icon={<UserPlus className="w-8 h-8 text-[#c89933]" />}
          title="Create Account"
          description="Sign up using your JRU email to join the student marketplace."
        />

        <ArrowRight className="w-6 h-6 text-white" />

        {/* Step 2 */}
        <Step
          icon={<Search className="w-8 h-8 text-[#c89933]" />}
          title="Browse or Offer Services"
          description="Explore available services or offer your own as a Resolver."
        />

        <ArrowRight className="w-6 h-6 text-white" />

        {/* Step 3 */}
        <Step
          icon={<MessageCircle className="w-8 h-8 text-[#c89933]" />}
          title="Initiate Bookings"
          description="Chat to negotiate, then create bookings based on your agreement."
        />

        <ArrowRight className="w-6 h-6 text-white" />

        {/* Step 4 */}
        <Step
          icon={<CheckCircle className="w-8 h-8 text-[#c89933]" />}
          title="Complete Transaction"
          description="Confirm payment and task completion together with your peer."
        />
      </div>

      {/* Mobile-friendly stacked layout */}
      <div className="lg:hidden space-y-10">
        <Step
          icon={<UserPlus className="w-8 h-8 text-[#094074]" />}
          title="Create Account"
          description="Sign up using your JRU email to join the student marketplace."
        />
        <Step
          icon={<Search className="w-8 h-8 text-[#094074]" />}
          title="Browse or Offer Services"
          description="Explore available services or offer your own as a Resolver."
        />
        <Step
          icon={<MessageCircle className="w-8 h-8 text-[#094074]" />}
          title="Initiate Bookings"
          description="Chat to negotiate, then create bookings based on your agreement."
        />
        <Step
          icon={<CheckCircle className="w-8 h-8 text-[#094074]" />}
          title="Complete Transaction"
          description="Confirm payment and task completion together with your peer."
        />
      </div>
    </div>
  );
}

function Step({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center max-w-[200px] mx-auto h-full">
      <div className="flex flex-col items-center h-full">
        <div className="bg-white p-4 rounded-full shadow-md inline-block">
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white min-h-[3rem] flex items-center justify-center">
          {title}
        </h3>
        <p className="mt-2 text-blue-100 text-sm min-h-[4.5rem] flex items-center justify-center">
          {description}
        </p>
      </div>
    </div>
  );
}
