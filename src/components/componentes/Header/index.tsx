"use client"

import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { BellIcon } from "@radix-ui/react-icons";


export default function HeaderBar() {  
  return (
    <header className="hidden sm:flex flex-col py-4 z-0 mx-2 sm:mt-0">
      <Card className="rounded-sm shadow-gray-400 shadow-sm">
        <CardContent className=" p-2 m-0 ">
          <div className="flex-row flex items-center justify-end">
            <CardDescription className="mr-2 text-xs">
                Teste da Silva
            </CardDescription>
            <BellIcon className="mr-2"></BellIcon>
          </div>
        </CardContent>
      </Card>
    </header>
  );
}
