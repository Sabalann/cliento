'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registratie gelukt! Je kunt nu inloggen.');
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Registratie mislukt');
      }
    } catch (error) {
      setError('Er is een fout opgetreden tijdens de registratie');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-1">
            Gebruikersnaam
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder=""
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
            E-mailadres
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder=""
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">
            Wachtwoord
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder=""
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-1">
            Bevestig wachtwoord
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder=""
          />
        </div>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>

        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Bezig met registreren...' : 'Registreren'}
        </Button>
        </motion.div>
      </form>
    </div>
  );
}