import React, { useState } from 'react';
import { Trophy, Users, BookOpen, BarChart3, Settings, LogOut, Play, Award, ArrowLeft, Calendar, MessageSquare, Brain } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import BadgeShowcase from './BadgeShowcase';
import EventCalendar from './EventCalendar';
import Community from './Community';
import QuizGenerator from './QuizGenerator';

interface DashboardProps {
  onStartQuiz: () => void;
  onBackToLanding: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartQuiz, onBackToLanding }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const totalQuestions = 35; // 7 categories × 5 questions each
  const completedQuestions = user.progress?.completedQuestions.length || 0;
  const progressPercentage = (completedQuestions / totalQuestions) * 100;

  const handleLogout = () => {
    logout();
    onBackToLanding();
  };

  const getDashboardContent = () => {
    if (user.role === 'admin' && activeTab === 'users') {
      return <UserManagement />;
    }

    if (user.role === 'user' && activeTab === 'badges') {
      return (
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 min-h-screen p-4 -m-4">
          <BadgeShowcase />
        </div>
      );
    }

    if (activeTab === 'events') {
      return <EventCalendar />;
    }

    if (activeTab === 'community') {
      return <Community />;
    }

    if (activeTab === 'quizzes') {
      return <QuizGenerator />;
    }

    switch (user.role) {
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Users className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Total Users</h3>
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-gray-300 text-sm">+12 this week</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <BookOpen className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Completed Quizzes</h3>
                <p className="text-2xl font-bold text-white">1,234</p>
                <p className="text-gray-300 text-sm">+45 this week</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Avg Score</h3>
                <p className="text-2xl font-bold text-white">847</p>
                <p className="text-gray-300 text-sm">out of 1500</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                System Overview
              </h3>
              <p className="text-gray-300">Manage users, view analytics, and oversee the learning platform.</p>
            </div>
          </div>
        );

      case 'mentor':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">My Students</h3>
                <p className="text-2xl font-bold text-white">24</p>
                <p className="text-gray-300 text-sm">Active learners</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Student Progress</h3>
                <p className="text-2xl font-bold text-white">78%</p>
                <p className="text-gray-300 text-sm">Average completion</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Recent Student Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sarah completed AWS Basics</span>
                  <span className="text-green-400 text-sm">2 hours ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Mike scored 890 on Cybersecurity</span>
                  <span className="text-blue-400 text-sm">5 hours ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Alex started new quiz session</span>
                  <span className="text-yellow-400 text-sm">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      default: // user
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                Your Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Quiz Completion</span>
                    <span className="text-white font-semibold">{completedQuestions}/{totalQuestions}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-sm text-gray-400 mt-1">{progressPercentage.toFixed(0)}% complete</p>
                </div>
                
                {user.progress && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-400">Current Score</p>
                      <p className="text-xl font-bold text-white">{user.progress.totalScore}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Session</p>
                      <p className="text-sm text-white">
                        {new Date(user.progress.lastSession).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-3">Continue Learning</h3>
              <p className="text-gray-300 mb-4">
                Level up your skills across 7 technology domains with gamified learning, mentorship, and AI guidance.
              </p>
              <Button
                onClick={onStartQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{completedQuestions > 0 ? 'Continue Quiz' : 'Start Quiz'}</span>
              </Button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-400" />
                Achievement Progress
              </h3>
              <p className="text-gray-300 mb-4">
                You're on track to earn amazing badges! Check out all available achievements.
              </p>
              <Button
                onClick={() => setActiveTab('badges')}
                variant="outline"
                className="border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-200"
              >
                <Award className="w-4 h-4 mr-2" />
                View All Badges
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBackToLanding}
              variant="outline"
              className="border-gray-400 text-gray-300 hover:bg-gray-400/10 hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user.username}!
              </h1>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                  user.role === 'mentor' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {user.role.toUpperCase()}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300 text-sm">PerX Learning Platform</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-400 text-red-300 hover:bg-red-400/10 hover:text-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto">
          <Button
            onClick={() => setActiveTab('overview')}
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            className={activeTab === 'overview' ? 'bg-blue-600 text-white' : 'border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200'}
          >
            Overview
          </Button>
          
          <Button
            onClick={() => setActiveTab('community')}
            variant={activeTab === 'community' ? 'default' : 'outline'}
            className={activeTab === 'community' ? 'bg-blue-600 text-white' : 'border-orange-400 text-orange-300 hover:bg-orange-400/10 hover:text-orange-200'}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Community
          </Button>
          
          <Button
            onClick={() => setActiveTab('events')}
            variant={activeTab === 'events' ? 'default' : 'outline'}
            className={activeTab === 'events' ? 'bg-blue-600 text-white' : 'border-green-400 text-green-300 hover:bg-green-400/10 hover:text-green-200'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Tech Events
          </Button>
          
          <Button
            onClick={() => setActiveTab('Create Quiz')}
            variant={activeTab === 'quizzes' ? 'default' : 'outline'}
            className={activeTab === 'quizzes' ? 'bg-blue-600 text-white' : 'border-purple-400 text-purple-300 hover:bg-purple-400/10 hover:text-purple-200'}
          >
            <Brain className="w-4 h-4 mr-2" />
            Quizzes
          </Button>
          
          {user.role === 'admin' && (
            <Button
              onClick={() => setActiveTab('users')}
              variant={activeTab === 'users' ? 'default' : 'outline'}
              className={activeTab === 'users' ? 'bg-blue-600 text-white' : 'border-purple-400 text-purple-300 hover:bg-purple-400/10 hover:text-purple-200'}
            >
              <Users className="w-4 h-4 mr-2" />
              User Management
            </Button>
          )}
          
          {user.role === 'user' && (
            <Button
              onClick={() => setActiveTab('badges')}
              variant={activeTab === 'badges' ? 'default' : 'outline'}
              className={activeTab === 'badges' ? 'bg-blue-600 text-white' : 'border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-200'}
            >
              <Award className="w-4 h-4 mr-2" />
              Badges
            </Button>
          )}
        </div>

        {/* Dashboard Content */}
        {getDashboardContent()}
      </div>
    </div>
  );
};

export default Dashboard;
