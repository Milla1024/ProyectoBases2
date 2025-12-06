import type { SVGProps } from "react";

export function OracleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11.93 5.14A8.5 8.5 0 1 0 5.14 11.93" />
      <path d="M12 12h7.86" />
      <path d="M12 12V4.14" />
      <path d="M12 12l5.56-5.56" />
    </svg>
  );
}

export function MySqlIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11.333 4.223c0-1.12.83-1.638 1.746-1.076l8.114 4.88c.9.542.902 1.61.002 2.15l-8.114 4.88c-.916.55-1.748.05-1.748-1.07v-3.088c-3.131.25-5.592 1.74-5.592 4.156 0 2.21 1.95 3.5 5.592 3.5 3.642 0 5.592-1.29 5.592-3.5v-1.5" />
      <path d="M18 19v-4.5" />
      <ellipse cx="6.5" cy="12.5" rx="4.5" ry="5.5" />
    </svg>
  );
}
