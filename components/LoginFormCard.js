// In LoginFormCard component
export default function LoginFormCard({ children, className = "" }) {
  return (
    <div
      className={`container h-full w-2/5 flex flex-col items-center justify-between p-7 ${className}`}
    >
      {children}
    </div>
  );
}
