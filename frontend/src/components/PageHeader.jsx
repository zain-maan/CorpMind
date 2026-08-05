import { useAuth } from "../context/AuthContext";

export default function PageHeader({ title, subtitle, actions }) {
  const { user, getBranchName } = useAuth();
  const branchName = getBranchName(user?.branch_id);

  return (
    <header className="bg-card border-b border-border px-5 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-card relative z-10">
      <div>
        <h2 className="font-heading font-semibold text-[18px] md:text-[19px] text-text-primary">{title}</h2>
        {subtitle && <p className="text-[13px] md:text-[13.5px] text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {actions}
        <div className="text-right hidden sm:block">
          <p className="text-sm text-text-primary leading-tight">{user?.full_name}</p>
          <p className="text-[11px] font-mono uppercase text-text-faint">
            {user?.role}
            {branchName ? ` · ${branchName}` : user?.branch_id ? " · branch" : " · company-wide"}
          </p>
        </div>
      </div>
    </header>
  );
}