import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Layers,
  ClipboardList,
  Wrench,
  Calculator,
  ScrollText,
  UserCircle,
  UserCheck,
  Building2,
  TrendingUp,
  Sparkles,
  DollarSign,
  FileBarChart2,
  CalendarDays,
  Megaphone,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "@/assets/cliveo-logo.png";
import { cn } from "@/lib/utils";

type NavItem = {
  to?: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  divider?: boolean;
  groupLabel?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Visão Geral",
    items: [{ to: "/", label: "Visão Geral", icon: LayoutDashboard }],
  },
  {
    title: "Comercial",
    items: [
      { to: "/crm/leads", label: "Leads", icon: UserCheck },
      { to: "/crm/empresas", label: "Empresas", icon: Building2 },
      { to: "/crm/oportunidades", label: "Oportunidades", icon: TrendingUp },
      { to: "/clientes", label: "Clientes", icon: Users },
      { divider: true, groupLabel: "Captação", label: "Captação", icon: Sparkles },
      { to: "/crm/campanhas", label: "Campanhas", icon: Sparkles },
      { to: "/crm/landing-pages", label: "Landing Pages", icon: Sparkles },
      { to: "/crm/formularios", label: "Formulários", icon: Sparkles },
      { divider: true, groupLabel: "Relacionamento", label: "Relacionamento", icon: Sparkles },
      { to: "/crm/automacoes", label: "Automações", icon: Sparkles },
      { to: "/crm/sequencias", label: "Sequências", icon: Sparkles },
      { to: "/crm/email-marketing", label: "E-mail Marketing", icon: Sparkles },
      { to: "/crm/whatsapp", label: "WhatsApp", icon: Sparkles },
      { divider: true, groupLabel: "Relatórios", label: "Relatórios", icon: FileBarChart2 },
      { to: "/crm/relatorios", label: "Relatórios", icon: FileBarChart2 },
    ],
  },
  {
    title: "Projetos",
    items: [
      { to: "/projetos", label: "Projetos", icon: FolderKanban },
      { to: "/briefing", label: "Briefings", icon: ClipboardList },
      { to: "/servicos", label: "Serviços", icon: Wrench },
    ],
  },
  {
    title: "Ativos",
    items: [{ to: "/ativos", label: "Biblioteca de Ativos", icon: Layers }],
  },
  {
    title: "Marketing",
    items: [
      { label: "Planejamento", icon: Sparkles, disabled: true },
      { label: "Conteúdo", icon: Sparkles, disabled: true },
      { label: "Calendário", icon: CalendarDays, disabled: true },
      { label: "Campanhas", icon: Megaphone, disabled: true },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { to: "/precificacao", label: "Financeiro", icon: DollarSign },
      { to: "/precificacao", label: "Precificação", icon: Calculator },
    ],
  },
  {
    title: "Gestão",
    items: [
      { to: "/auditoria", label: "Auditoria", icon: ScrollText },
      { label: "Relatórios", icon: FileBarChart2, disabled: true },
    ],
  },
  {
    title: "Clientes",
    items: [{ to: "/portal-manager", label: "Portal do Cliente", icon: UserCircle }],
  },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    NAV_SECTIONS.reduce((acc, section) => {
      acc[section.title] = section.items.length > 1;
      return acc;
    }, {} as Record<string, boolean>),
  );

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

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
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_SECTIONS.map((section, index) => {
          const isOpen = openSections[section.title];

          return (
            <div key={section.title} className={cn(index > 0 && "pt-5")}>
              {index > 0 ? <div className="h-px bg-sidebar-border/80" /> : null}
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <span className="text-[11px] uppercase tracking-[0.28em]">{section.title}</span>
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              {isOpen && (
                <div className="space-y-1 mt-1">
                  {section.items.map((item, itemIndex) => {
                    const active = item.to
                      ? pathname === item.to || (item.to !== "/" && pathname.startsWith(`${item.to}/`))
                      : false;

                    const itemClassName = cn(
                      "group flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-foreground border border-primary/30"
                        : item.disabled
                          ? "cursor-not-allowed text-muted-foreground/70"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    );

                    const content = (
                      <div className={itemClassName}>
                        <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
                        <span className={cn("truncate", item.disabled && "opacity-80")}>
                          {item.label}
                        </span>
                      </div>
                    );

                    return (
                      <div key={`${section.title}-${item.label}-${itemIndex}`}>
                        {item.divider ? (
                          <div className="pt-3">
                            <div className="h-px bg-sidebar-border/80" />
                            {item.groupLabel ? (
                              <div className="px-4 pt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">
                                {item.groupLabel}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {!item.divider && (item.to && !item.disabled ? (
                          <Link to={item.to}>{content}</Link>
                        ) : (
                          <div>{content}</div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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