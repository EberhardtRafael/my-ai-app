"use client";

import React, {useEffect, useState} from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import SearchBox from "./SearchBox";

export default function Header() {
  const { data: session, status } = useSession();
  const homeText = "Home";
  const productsText = "Products";
  const searchPlaceholder = "Search product by name or property";
 
  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const [searchValue, setSearchValue] = useState<string>(search);

  useEffect(() => {
    setSearchValue(search);
  }, [searchParams]);

  const onSearchChange = (searchTerm: string) => {
    setSearchValue(searchTerm);
    if(!searchTerm) onSearch("");
  }

  const onSearch = (searchTerm: string) => {
    const params = new URLSearchParams();
    searchTerm && params.set("search", searchTerm);
    !searchTerm && params.delete("search");
    router.push(`/plp?${params.toString()}`); 
  }

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
      <SearchBox value={searchValue} placeholder={searchPlaceholder} onChange={onSearchChange} onSearch={onSearch} />
      {session && (
        <>
          <span className="text-sm">{session.user?.name || session.user?.email}</span>
          <Button onClick={() => signOut()} className="ml-2">Sign Out</Button>
        </>
      )}
    </header>
  );
}
