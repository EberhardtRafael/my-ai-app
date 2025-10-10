"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/Button";

export default function Header() {
  const homeText = "Home";
  const productsText = "Products";
  const headerText = "My App";
 
  const pathname = usePathname();
  return (
    <header className="w-full flex justify-between items-center p-4 bg-gray-100 shadow-sm text-gray-700">
      <nav className="flex gap-4">
        <Link href="/">
          <Button disabled={pathname === "/"}>
            {homeText}
          </Button>
        </Link>
        <Link href="/plp">
          <Button disabled={pathname === "/plp"}>
            {productsText}
          </Button>
        </Link>
      </nav>
      <h1 className="text-2xl font-bold">{headerText}</h1>
    </header>
  );
}
