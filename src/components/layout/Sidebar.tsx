import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Layers,
  ClipboardList,
  Wrench,
  Calculator,
  ScrollText,
  RefreshCw,
  UserCog,
} from "lucide-react";
import logo from "@/assets/cliveo-logo.png";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/projetos", label: "Projetos", icon: FolderKanban, soon: true },
  { to: "/ativos", label: "Central de Ativos", icon: Layers },
  { to: "/briefing", label: "Matriz de Briefing", icon: ClipboardList },
  { to: "/servicos", label: "Gestão de Serviços", icon: Wrench },
  { to: "/precificacao", label: "Precificação", icon: Calculator, soon: true },
  { to: "/auditoria", label: "Auditoria", icon: ScrollText, soon: true },
  { to: "/refacoes", label: "Refações", icon: RefreshCw, soon: true },
  { to: "/portal", label: "Portal do Cliente", icon: UserCog, soon: true },
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
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const content = (
            <>
              <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.soon && (
                <span className="text-[9px] uppercase tracking-wider rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                  em breve
                </span>
              )}
            </>
          );

          if (item.soon) {
            return (
              <div
                key={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed",
                  active
                    ? "bg-primary/10 text-foreground border border-primary/30"
                    : "text-muted-foreground",
                )}
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--brand-amber)]" />
          Sistema operacional CLIVEO v0.1
        </div>
      </div>
    </aside>
  );
}
