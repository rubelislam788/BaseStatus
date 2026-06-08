import { CardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="container py-8">
      <CardSkeleton rows={4} />
    </main>
  );
}
