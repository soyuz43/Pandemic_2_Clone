export function PlaneIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
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
      <path d="M10.5 20.5 12 19l1.5 1.5-1.5-1-1.5 1Z" />
      <path d="M2 13h20" />
      <path d="M12 4.5 22 13l-4 .8L12 8 6 13.8 2 13l10-8.5Z" />
      <path d="M9 14v6l3-2 3 2v-6" />
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
