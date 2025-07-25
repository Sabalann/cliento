"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button"


function AuthButton() {
  const { data: session } = useSession();

    if (session) {
        return (
            <>
            </>
        );
    }
    return (
        <>
            <Button asChild variant="ghost" size="sm" className="text-sm" onClick={() => signIn()}>
              <a href="#">Log in</a>
            </Button>
            <Button asChild size="sm" className="text-sm">
            <a href="register">Registreer</a>
            </Button>

        </>
    );
}

export default function NavMenu() {

  return (
    <header className=" px-4 md:px-6 full-w">
        {/* Right side */}
        <div className="flex items-center gap-2 justify-end">
          <AuthButton />
        </div>
    </header>
  )
}