interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function PageHeader({ title, actionLabel, onAction }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      {actionLabel && (
        <button
          onClick={onAction}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
