import React, { useState } from "react";
import { DEFAULT_STATIONS } from "../types";

interface LoginScreenProps {
  onLogin: (name: string, station: string, password: string, email: string, code: string) => void;
  onSignup: (name: string, station: string, password: string, email: string, code: string) => void;
  onRequestCode: (email: string) => void;
  savedName?: string;
  savedStation?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onSignup,
  onRequestCode,
  savedName = "",
  savedStation = "station-1",
}) => {
  const [name, setName] = useState(savedName);
  const [station, setStation] = useState(savedStation);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && password.trim() && email.trim() && code.trim()) {
      onLogin(name.trim(), station, password.trim(), email.trim(), code.trim());
    }
  };

  return (
    <div className="h-full bg-dark-950 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-fire-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-fire-600/30">
            <svg className="w-12 h-12 text-fire-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">FireComm OS</h1>
          <p className="text-dark-400 text-sm">Real-Time Station Communication</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input-field w-full"
              required
              autoFocus
            />
          </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Station</label>
        <select
          value={station}
          onChange={(e) => setStation(e.target.value)}
              className="input-field w-full"
            >
              {DEFAULT_STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
      </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Government Email (.gov)</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@agency.gov"
                className="input-field flex-1"
                required
              />
              <button
                type="button"
                className="btn-secondary whitespace-nowrap px-3"
                onClick={() => {
                  if (email.trim()) onRequestCode(email.trim());
                }}
              >
                Send Code
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="input-field w-full"
              required
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button type="submit" className="btn-primary flex-1 text-base py-3">
              Sign In
            </button>
            <button
              type="button"
              className="btn-secondary flex-1 text-base py-3"
              onClick={() => {
                if (name.trim() && password.trim() && email.trim() && code.trim()) {
                  onSignup(name.trim(), station, password.trim(), email.trim(), code.trim());
                }
              }}
            >
              Create Account
            </button>
          </div>
        </form>

        <p className="text-center text-dark-500 text-xs mt-6">
          LAN-based communication system
          <br />
          No internet connection required
        </p>
      </div>
    </div>
  );
};
