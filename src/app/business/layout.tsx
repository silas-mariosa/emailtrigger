import type { Metadata } from "next";
import "@/css/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SideBar } from "@/components/componentes/SideBar/SideBarBuilder";
import SideBarData from "@/components/componentes/SideBar/SideBarData.json"
import HeaderBar from "@/components/componentes/Header";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export const metadata: Metadata = {
	title: "Email Trigger App",
	description: "Aplicativo de disparador de e-mails",
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
				<TooltipProvider>
					<SideBar
						companyName=""
						buttonTop={SideBarData.buttonTop}
						buttonBotton={SideBarData.buttonBotton}
					>
						<HeaderBar></HeaderBar>
						{children}
					</SideBar>
					<Toaster />
				</TooltipProvider>
			</body>
		</html>
	);
}
