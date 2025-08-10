"use client";

import Image from "next/image";
import Link from "next/link";
import RegisterForm from "../components/RegisterForm";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import DarkVeil from "@/app/components/DarkVeil";

export default function Register() {
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
          <h1 className="text-xl font-semibold text-white">Maak je Cliento-account aan</h1>
          <p className="text-sm text-white/80">Heb je al een account? <Link href="/auth/signin" className="text-blue-300 hover:text-blue-200">Log in</Link></p>
        </motion.div>
        <RegisterForm />
      </motion.div>
    </div>
  );
}