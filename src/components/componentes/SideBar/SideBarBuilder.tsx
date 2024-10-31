
import { SideBarProps } from "./SideBarTypes"
import SheetFormer from "@/components/componentes/sheetFormer/SheetFormer";
import { SideBarStaticFormer } from "@/components/componentes/sideBar-builder/SideBarStaticFormer";
import { Package2 } from "lucide-react";

export function SideBar({
    buttonTop,
    buttonBotton = [],
    companyName,   
    children 
}: SideBarProps) {
    return (
        <div className="">
            <SideBarStaticFormer
                buttonTop={buttonTop}
                buttonBotton={buttonBotton}
                companyName={companyName}
            />
            <div className="flex flex-col sm:pl-14">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <SheetFormer
                        triggerIcon={<Package2 className="h-5 w-5" />}
                        triggerLabel="Open Sidebar"
                        position="left"
                        buttonTop={buttonTop}
                        buttonBotton={buttonBotton}
                        companyName={companyName}
                    />
                </header>       
                <div className="flex flex-col w-full">{children}</div>         
            </div>
        </div>
    )
}