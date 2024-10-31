import type { Metadata } from "next";
import "@/css/globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Email Trigger App",
  description: "Disparador de e-mails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className=''
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
