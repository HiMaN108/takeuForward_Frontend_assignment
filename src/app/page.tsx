"use client";

import dynamic from "next/dynamic";

const CalendarDashboard = dynamic(
  () => import("@/components/CalendarDashboard"),
  { ssr: false }
);

export default function Home() {
  return <CalendarDashboard />;
}
