import Link from "next/link";
import { Server, Zap, Shield, Box } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans selection:bg-blue-200">
      {/* Apple-style minimalist nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-xs font-medium tracking-wide text-gray-800">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4" />
            <span className="font-semibold tracking-widest uppercase">Daksh</span>
          </div>
          <div className="space-x-8 hidden md:flex">
            <Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
            <Link href="/docs" className="hover:text-blue-600 transition-colors">Overview</Link>
            <Link href="/docs" className="hover:text-blue-600 transition-colors">Infrastructure</Link>
            <Link href="/docs" className="hover:text-blue-600 transition-colors">Security</Link>
          </div>
          <div>
            <Link href="/dashboard" className="bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
              Developer Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 flex flex-col items-center text-center">
        <h2 className="text-[1.5rem] md:text-[2rem] font-semibold text-gray-500 mb-2">Daksh Cloud</h2>
        <h1 className="text-[3.5rem] md:text-[5.5rem] font-bold leading-tight tracking-tight max-w-5xl mb-6">
          The ultimate gameplay <br/>backend service.
        </h1>
        <p className="text-[1.25rem] md:text-[1.5rem] text-gray-500 max-w-3xl mb-10 font-medium">
          Purpose-built for real-time multiplayer. Handle matchmaking, server-authoritative game state, and LiveOps without writing a single line of netcode.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white text-[1.1rem] px-8 py-3.5 rounded-full font-medium transition-colors"
          >
            Start Building
          </Link>
          <Link 
            href="/docs"
            className="bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] text-[1.1rem] px-8 py-3.5 rounded-full font-medium transition-colors"
          >
            Explore Documentation
          </Link>
        </div>

        {/* Apple-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mt-32 text-left">
          <div className="bg-[#f5f5f7] rounded-3xl p-10 flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
            <Zap className="w-12 h-12 text-blue-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-3">Real-time multiplayer.</h3>
            <p className="text-gray-500 font-medium">Built-in WebSockets and gRPC. Synchronize your game state across thousands of players with zero-latency.</p>
          </div>
          <div className="bg-[#f5f5f7] rounded-3xl p-10 flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
            <Shield className="w-12 h-12 text-green-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-3">Authoritative gameplay.</h3>
            <p className="text-gray-500 font-medium">Write custom TypeScript RPCs. Validate match results, control the economy, and stop hackers at the server level.</p>
          </div>
          <div className="bg-[#f5f5f7] rounded-3xl p-10 flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
            <Box className="w-12 h-12 text-purple-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-3">Matchmaking & LiveOps.</h3>
            <p className="text-gray-500 font-medium">Elo-based matchmaking, leaderboards, and daily rewards—fully managed and instantly deployable.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
