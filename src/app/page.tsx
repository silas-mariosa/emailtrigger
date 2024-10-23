import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Button>
        <Link href="/business/dashboard">
          Dashboard
        </Link>
      </Button>
      <Button>
        <Link href="/business/template">
          Template Builder
        </Link>
      </Button>
      <Button>
        <Link href="/business/landingbuilder">
          Page Builder
        </Link>
      </Button>
    </div>
  );
}
