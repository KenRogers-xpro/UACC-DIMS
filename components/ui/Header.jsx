import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-4 bg-transparent">
      <div className="w-full max-w-screen-2xl mx-auto px-4 flex justify-between items-center">
        <Link href="/">DIMS</Link>
        <nav>
          <Link href="/login">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
