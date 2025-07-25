import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import { getServerSession } from "next-auth";
import NavMenu from "./components/NavMenu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cliento",
  description: "A client management system for freelancers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider session={session}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex justify-between h-16 shrink-0 items-center gap-2 border-b px-4">
                <div className="flex items-center gap-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4"/>
                </div>
                <NavMenu/>

        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
        <main className="text-2xl flex flex-col w-full">
                  {children}
              </main>
        </div>
        </SidebarInset>
        </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
