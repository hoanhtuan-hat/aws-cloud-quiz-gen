
import React, { useState } from 'react';
import { Shield, Cloud, Trophy, Users, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import LoginModal from './LoginModal';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">PerX</span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Level Up Learning, Empower Alumni, and Guide with AI
          </p>
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">For Per Scholas Alumni</span>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Button
            onClick={() => setShowLoginModal(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>
          <Button
            onClick={() => setShowLoginModal(true)}
            variant="outline"
            size="lg"
            className="border-2 border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Register
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Gamified Learning</h3>
            <p className="text-gray-300 text-sm">
              Earn XP, unlock badges, build streaks, and level up your skills through interactive quizzes and challenges
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Alumni Mentorship</h3>
            <p className="text-gray-300 text-sm">
              Connect with Per Scholas alumni for guidance, career advice, and collaborative learning experiences
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">AI Guidance</h3>
            <p className="text-gray-300 text-sm">
              Get personalized learning recommendations and instant support from your AI mentor companion
            </p>
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
          <h3 className="text-white font-semibold mb-4">How PerX Works</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="text-left">
              <p className="mb-2">• Access quizzes in ≤2 clicks (reduced from 7+)</p>
              <p className="mb-2">• Earn XP, badges, and maintain learning streaks</p>
              <p>• Track progress across multiple tech domains</p>
            </div>
            <div className="text-left">
              <p className="mb-2">• Connect with alumni mentors for guidance</p>
              <p className="mb-2">• Get AI-powered learning recommendations</p>
              <p>• Access admin portal and Canvas integration</p>
            </div>
          </div>
        </div>

        {/* Quick Start Option */}
        <div className="space-y-4">
          <Button
            onClick={onStart}
            size="lg"
            variant="outline"
            className="border-2 border-gray-300 text-gray-200 hover:bg-gray-300/10 hover:text-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Learning (Guest Mode)
          </Button>
          <p className="text-sm text-gray-400">
            Sign in to unlock XP, badges, mentorship features, and AI guidance
          </p>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {/* Navigation handled by Index component */}}
      />
    </div>
  );
};

export default LandingPage;
