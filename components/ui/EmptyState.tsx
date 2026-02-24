export default function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-gray-500">
      {text}
    </div>
  );
}