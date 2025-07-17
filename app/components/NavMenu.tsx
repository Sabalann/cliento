"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

function AuthButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <>
                <p>Aangemeld als {session.user?.name}</p>
                <button className="pointer-cursor" onClick={() => signOut()}>Log uit</button>
            </>
        );
    }
    return (
        <>
            <p>Je bent niet aangemeld</p>
            <button className="hover:pointer-cursor" onClick={() => signIn()}>Log in</button>
            <Link href="/register">Registreer</Link>

        </>
    );
}

export default function NavMenu() {
    return (
        <div className="max-w bg-[#7867ea]">
            <AuthButton />
        </div>
    );
}