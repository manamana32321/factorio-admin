"use client";

import {
  LayoutDashboard,
  Terminal,
  Users,
  Save,
  Archive,
  BarChart3,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "콘솔", href: "/dashboard/console", icon: Terminal },
  { title: "플레이어", href: "/dashboard/players", icon: Users },
  { title: "세이브", href: "/dashboard/saves", icon: Save },
  { title: "백업", href: "/dashboard/backups", icon: Archive },
  { title: "메트릭", href: "/dashboard/metrics", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-zinc-800">
      <SidebarHeader className="border-b border-zinc-800 p-4">
        <h1 className="text-lg font-bold text-zinc-50">Factorio Admin</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500">
            메뉴
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-zinc-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-zinc-50"
          onClick={() =>
            authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })
          }
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
