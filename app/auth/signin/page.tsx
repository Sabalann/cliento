"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import DarkVeil from "@/app/components/DarkVeil";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: true,
        callbackUrl: "/",
        username,
        password,
      });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError("Inloggen mislukt. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10" style={{ width: '100%', height: '100%' }}>
        <DarkVeil />
      </div>
      <motion.div
        className="fixed top-4 left-4 z-10"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white hover:text-white/90 bg-white/10 hover:bg-white/15 backdrop-blur-md transition"
        >
          <ChevronLeft className="h-4 w-4" />
          Terug
        </Link>
      </motion.div>

      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-white/20 p-6 shadow-lg bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <motion.div
          className="flex flex-col items-center gap-3 mt-2 mb-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        >
          <Image src="/cliento-logo.svg" alt="Cliento logo" width={64} height={64} priority />
          <h1 className="text-xl font-semibold text-white">Inloggen bij Cliento</h1>
          <p className="text-sm text-white/80">Heb je nog geen account? <Link href="/register" className="text-blue-300 hover:text-blue-200">Registreer</Link></p>
        </motion.div>

        <form onSubmit={onCredentialsSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm text-white/90">Gebruikersnaam</label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              autoComplete="username"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/30"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-white/90">Wachtwoord</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              autoComplete="current-password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/30"
            />
          </div>
          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Bezig met inloggen..." : "Inloggen"}
            </Button>
          </motion.div>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-2 my-4 select-none">
            <span className="h-px flex-1 bg-white/20" />
            <span className="text-xs uppercase text-white/60">Of ga verder met</span>
            <span className="h-px flex-1 bg-white/20" />
          </div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              variant="default"
              className="w-full bg-black text-white hover:bg-black/90"
              onClick={() => signIn("github", { callbackUrl: "/" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.486 2 12.018c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.688-.103-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.297 2.748-1.026 2.748-1.026.547 1.378.203 2.397.1 2.65.64.701 1.027 1.595 1.027 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.922.678 1.859 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.481A10.02 10.02 0 0 0 22 12.018C22 6.486 17.523 2 12 2Z" clipRule="evenodd" />
              </svg>
              Inloggen met GitHub
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


