export function PlaneIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2 9.5 10 2 14v2l7.5-2.5V19l-2 1.5V22l4.5-1 4.5 1v-1.5L14.5 19v-5.5L22 16v-2l-7.5-4L12 2Z" />
    </svg>
  );
}

export function ShipIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 13h16l-2.2 5.2a2 2 0 0 1-1.8 1.2H8a2 2 0 0 1-1.8-1.2L4 13Z" />
      <path d="M9 13V8h6v5" />
      <path d="M12 4v4" />
      <path d="M2 21c1.7 0 1.7-1 3.4-1s1.7 1 3.3 1 1.7-1 3.3-1 1.7-1 3.3-1 1.7 1 3.3 1 1.7-1 3.3-1 1.7 1 3.4 1" />
    </svg>
  );
}
