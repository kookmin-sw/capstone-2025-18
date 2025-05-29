import { Suspense } from "react";
import IndividualClient from "./client";
export default function IndividualPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <IndividualClient />
    </Suspense>
  );
}