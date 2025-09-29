"use client";

import { useSearchParams } from "next/navigation";
import ClientHome from "./clienthome";

export default function SearchParamsClient() {
  const sp = useSearchParams();
  const scan = sp.get("scan") ?? undefined;
  const point = sp.get("point") ?? undefined;

  return <ClientHome scan={scan} point={point} />;
}
