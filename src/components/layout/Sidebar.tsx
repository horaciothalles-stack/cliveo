import { Link, useLocation } from "@tanstack/react-router";
import { 
  Users, 
  Briefcase, 
  ChevronDown,
  ChevronRight,
  Receipt,
  LogOut,
  Sparkles,
  Megaphone,
  Eye,
  LayoutDashboard,
  Target,
  Radar
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarMenuItem {
  title: string;
  icon: any;
  path?: string;
  submenu?: { title: string; path: string }[];
}

export function Sidebar() {
  const location = useLocation();
  const [isCrmOpen, setIsCrmOpen] = useState(true);
  const [isVisionOpen, setIsVisionOpen] = useState(true);

  // MENU REFATORADO: Dashboard aponta para a home (/), Campanhas e Captação (Radar) separados!
  const menuItems: SidebarMenuItem[] = [
    {
      title: "Visão Geral",
      icon: Eye,
      submenu: [
        { title: "Dashboard", path: "/_authenticated/" }, // Aponta para a home raiz pós-login
        { title: "Carteira de Clientes", path: "/clientes" },
      ],
    },
    {
      title: "Comercial (Gabriel)",
      icon: Users,
      submenu: [
        { title: "Gestão de Leads", path: "/crm/leads" },
        { title: "Oportunidades (Kanban)", path: "/crm/oportunidades" },
        { title: "Campanhas & LPs", path: "/crm/campanhas" },      // Foco em ofertas e landing pages
        { title: "Radar de Prospecção", path: "/crm/landing-pages" }, // Rota do Scraper do Google Maps
        { title: "E-mail Marketing", path: "/crm/email-marketing" },
        { title: "WhatsApp Automações", path: "/crm/whatsapp" },
      ],
    },
    {
      title: "Marketing (Thalles)",
      icon: Megaphone,
      submenu: [
        { title: "Briefings", path: "/briefing" },
        { title: "Projetos de Conteúdo", path: "/projetos" },
        { title: "Central de Ativos", path: "/ativos" },
      ],
    },
    {
      title: "Gestão & Financeiro (Mel)",
      icon: Receipt,
      submenu: [
        { title: "Fluxo de Caixa", path: "/auditoria" },
        { title: "Precificador Técnico", path: "/precificacao" },
        { title: "Pedidos de Alteração", path: "/refacoes" },
        { title: "Portal Manager", path: "/portal-manager" },
      ],
    },
  ];

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col text-foreground select-none shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center gap-3 shrink-0">
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-wider block leading-none">CLIVEO</span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1 block">HRC Lab OS</span>
        </div>
      </div>

      {/* Menu Navigation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        {menuItems.map((item, idx) => {
          const isSubmenu = !!item.submenu;
          const isCrmSection = item.title.includes("Comercial");
          const isVisionSection = item.title.includes("Visão Geral");

          const isOpen = isVisionSection ? isVisionOpen : (isCrmSection ? isCrmOpen : true);
          
          const toggleOpen = () => {
            if (isVisionSection) setIsVisionOpen(!isVisionOpen);
            if (isCrmSection) setIsCrmOpen(!isCrmOpen);
          };

          return (
            <div key={idx} className="space-y-1">
              <button
                onClick={toggleOpen}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span>{item.title}</span>
                </div>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isOpen && (
                <div className="pl-9 space-y-1 border-l border-border/50 ml-6 mt-1">
                  {item.submenu?.map((sub, subIdx) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <Link
                        key={subIdx}
                        to={sub.path}
                        className={cn(
                          "block px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          isSubActive
                            ? "text-primary font-bold bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/5"
                        )}
                      >
                        {sub.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logout Footer Section */}
      <div className="p-4 border-t border-border shrink-0">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-10 px-4 rounded-lg text-sm font-medium">
          <LogOut size={18} />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}