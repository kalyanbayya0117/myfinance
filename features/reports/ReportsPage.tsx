import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" />

      <EmptyState text="Financial reports will appear here." />
    </>
  );
}