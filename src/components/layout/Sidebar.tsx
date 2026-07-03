import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/cliveo-logo.png";
import { cn } from "@/lib/utils";

type NavItem = {
  to?: string;
  label: string;
  disabled?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "🏠 Visão Geral",
    items: [{ to: "/", label: "Visão Geral" }],
  },
  {
    title: "🚀 COMERCIAL",
    items: [
      { to: "/crm/leads", label: "Leads" },
      { to: "/crm/empresas", label: "Empresas" },
      { to: "/crm/oportunidades", label: "Oportunidades" },
      { to: "/clientes", label: "Clientes" },
    ],
  },
  {
    title: "📂 PROJETOS",
    items: [
      { to: "/projetos", label: "Projetos" },
      { to: "/briefing", label: "Briefings" },
      { to: "/servicos", label: "Serviços" },
    ],
  },
  {
    title: "🎨 ATIVOS",
    items: [{ to: "/ativos", label: "Biblioteca de Ativos" }],
  },
  {
    title: "📢 MARKETING",
    items: [
      { label: "Planejamento", disabled: true },
      { label: "Conteúdo", disabled: true },
      { label: "Calendário", disabled: true },
      { label: "Campanhas", disabled: true },
    ],
  },
  {
    title: "💰 FINANCEIRO",
    items: [
      { to: "/precificacao", label: "Financeiro" },
      { to: "/precificacao", label: "Precificação" },
    ],
  },
  {
    title: "📈 GESTÃO",
    items: [
      { to: "/auditoria", label: "Auditoria" },
      { label: "Relatórios", disabled: true },
    ],
  },
  {
    title: "👥 CLIENTES",
    items: [{ to: "/portal-manager", label: "Portal do Cliente" }],
  },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="size-9 rounded-md brand-gradient grid place-items-center shadow">
          <img src={logo} alt="CLIVEO" className="size-7 object-contain invert dark:invert-0" />
        </div>
        <div className="leading-tight">
          <div className="font-bold tracking-tight">CLIVEO</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">by HRC</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-4">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title} className={cn("space-y-2", index > 0 && "pt-5")}> 
            {index > 0 ? <div className="h-px bg-sidebar-border/80" /> : null}
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/75">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = item.to
                  ? pathname === item.to || (item.to !== "/" && pathname.startsWith(`${item.to}/`))
                  : false;

                const itemClassName = cn(
                  "group rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-foreground border border-primary/30"
                    : item.disabled
                      ? "cursor-not-allowed text-muted-foreground/70"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                );

                const content = (
                  <div className={itemClassName}>
                    <span className={cn("block truncate", item.disabled ? "opacity-80" : "")}>• {item.label}</span>
                  </div>
                );

                return item.to && !item.disabled ? (
                  <Link key={item.to} to={item.to}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t p-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brand-amber" />
          Sistema operacional CLIVEO v0.1
        </div>
      </div>
    </aside>
  );
}