"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Server, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Mock Authentication
    const user = {
      name: isLogin ? "Studio Admin" : name || "Studio Admin",
      email: email
    };
    
    localStorage.setItem("daksh_user", JSON.stringify(user));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center font-sans text-[#1d1d1f] p-6">
      
      <div className="absolute top-8 left-8 flex items-center space-x-2 text-gray-800">
        <Server className="w-5 h-5" />
        <span className="font-semibold tracking-widest uppercase text-sm">Daksh</span>
      </div>

      <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">
          {isLogin ? "Sign in to Daksh" : "Create Studio Account"}
        </h1>
        <p className="text-gray-500 text-center mb-10 font-medium">
          {isLogin ? "Welcome back to your control plane." : "Start orchestrating your game backends."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold mb-2">Studio Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Epic Games" 
                className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-2">Email address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@studio.com" 
              required
              className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3.5 font-medium transition-colors flex items-center justify-center mt-4"
          >
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Create one now" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
