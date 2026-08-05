export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/15 flex items-center justify-center mb-4 animate-pop-in">
          <Icon size={22} className="text-brand-dark" />
        </div>
      )}
      <p className="font-heading font-semibold text-[14.5px] text-text-primary mb-1">{title}</p>
      {description && (
        <p className="text-[13px] text-text-muted max-w-xs leading-relaxed mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
