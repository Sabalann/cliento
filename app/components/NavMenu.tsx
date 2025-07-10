"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

function AuthButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <>
                <p>Signed in as {session.user?.name}</p>
                <button onClick={() => signOut()}>Sign out</button>
            </>
        );
    }
    return (
        <>
            <p>You are not signed in</p>
            <button onClick={() => signIn()}>Sign in</button>
            <Link href="/register">Register</Link>

        </>
    );
}

export default function NavMenu() {
    return (
        <div>
            <AuthButton />
        </div>
    );
}