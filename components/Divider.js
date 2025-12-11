// components/Divider.js

export default function Divider({ orientation = 'horizontal' }) {
  const isHorizontal = orientation === 'horizontal';

  return isHorizontal ? (
    <hr className="my-8 h-px w-full border-0 bg-neutral-200" />
  ) : (
    <div className="mx-8 h-fill w-px self-stretch bg-neutral-200" />
  );
}
