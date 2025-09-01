"use client";

import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import Link from "next/link";
import DarkVeil from "@/app/components/DarkVeil";

export default function Home() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <div className="absolute inset-0 -z-10" style={{ width: '100%', height: '100%' }}>
          <DarkVeil />
        </div>
        <div className="text-white">Laden...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10" style={{ width: '100%', height: '100%' }}>
        <DarkVeil />
      </div>
      
      {session ? (
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-white/20 p-6 shadow-lg bg-white/10 backdrop-blur-xl text-center"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          >
            <p className="text-white/80 mb-6">Welkom terug, {session.user?.name}!</p>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Link 
                href="/dashboard" 
                className="inline-block bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-lg font-medium border border-white/20 backdrop-blur-md transition"
              >
                Ga naar je dashboard
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          >
            Projecten delen. Klanten betrekken.
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-white/80 mb-8"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
          >
            Een simpel portaal voor duidelijke communicatie en overzicht met je klanten.
          </motion.p>
          <motion.div 
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Link
                href="/auth/signin?callbackUrl=%2F"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium border border-white/20 backdrop-blur-md transition"
              >
                Log in
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Link
                href="/register"
                className="border border-white/40 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 backdrop-blur-md transition"
              >
                Registreer
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}


