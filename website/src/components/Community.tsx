
import React, { useState } from 'react';
import { Users, MessageSquare, BookOpen, Network, Plus, Heart, MessageCircle, Share2, Calendar, MapPin, Trophy, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  author: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  category: string;
}

interface AlumniMember {
  id: string;
  name: string;
  role: string;
  company: string;
  expertise: string[];
  avatar: string;
  status: 'online' | 'offline';
}

interface Resource {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  downloads: number;
  rating: number;
}

const Community: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('discussions');

  const mockPosts: Post[] = [
    {
      id: '1',
      author: 'Sarah Chen',
      role: 'Senior Cloud Architect',
      avatar: '/placeholder.svg',
      content: 'Just completed the AWS Solutions Architect certification! Happy to share study materials and tips with anyone preparing. The new quiz format really helped me practice.',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8,
      category: 'AWS'
    },
    {
      id: '2',
      author: 'Marcus Johnson',
      role: 'Cybersecurity Analyst',
      avatar: '/placeholder.svg',
      content: 'Looking for collaboration on a cybersecurity research project about zero-trust architecture. Anyone interested in contributing?',
      timestamp: '5 hours ago',
      likes: 15,
      comments: 12,
      category: 'Cybersecurity'
    },
    {
      id: '3',
      author: 'Emily Rodriguez',
      role: 'Data Engineer',
      avatar: '/placeholder.svg',
      content: 'Sharing my Python automation scripts for data pipeline monitoring. These have saved me countless hours at work!',
      timestamp: '1 day ago',
      likes: 32,
      comments: 6,
      category: 'Python'
    }
  ];

  const mockAlumni: AlumniMember[] = [
    {
      id: '1',
      name: 'Alex Thompson',
      role: 'DevOps Engineer',
      company: 'Google',
      expertise: ['AWS', 'Kubernetes', 'CI/CD'],
      avatar: '/placeholder.svg',
      status: 'online'
    },
    {
      id: '2',
      name: 'Jessica Park',
      role: 'AI Research Scientist',
      company: 'Microsoft',
      expertise: ['Machine Learning', 'Python', 'TensorFlow'],
      avatar: '/placeholder.svg',
      status: 'online'
    },
    {
      id: '3',
      name: 'David Kim',
      role: 'Blockchain Developer',
      company: 'Coinbase',
      expertise: ['Cryptocurrency', 'Solidity', 'DeFi'],
      avatar: '/placeholder.svg',
      status: 'offline'
    }
  ];

  const mockResources: Resource[] = [
    {
      id: '1',
      title: 'AWS Best Practices Guide',
      description: 'Comprehensive guide covering security, scalability, and cost optimization',
      author: 'Sarah Chen',
      category: 'AWS',
      downloads: 156,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Python Data Processing Templates',
      description: 'Ready-to-use templates for common data engineering tasks',
      author: 'Emily Rodriguez',
      category: 'Python',
      downloads: 89,
      rating: 4.6
    },
    {
      id: '3',
      title: 'Cybersecurity Incident Response Playbook',
      description: 'Step-by-step guide for handling security incidents',
      author: 'Marcus Johnson',
      category: 'Cybersecurity',
      downloads: 203,
      rating: 4.9
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Alumni Community</h1>
          <p className="text-gray-300">Connect, collaborate, and grow with fellow tech professionals</p>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="discussions" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="members" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="networking" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Network className="w-4 h-4 mr-2" />
              Networking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Community Discussions</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </div>

            <div className="grid gap-4">
              {mockPosts.map((post) => (
                <Card key={post.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={post.avatar} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white">{post.author}</h3>
                          <p className="text-sm text-gray-300">{post.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                          {post.category}
                        </Badge>
                        <span className="text-sm text-gray-400">{post.timestamp}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{post.content}</p>
                    <div className="flex items-center space-x-6">
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Alumni Network</h2>
              <div className="text-gray-300">
                {mockAlumni.filter(m => m.status === 'online').length} online • {mockAlumni.length} total members
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAlumni.map((member) => (
                <Card key={member.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          member.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{member.name}</h3>
                        <p className="text-sm text-gray-300">{member.role}</p>
                        <p className="text-sm text-gray-400">{member.company}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Expertise:</p>
                        <div className="flex flex-wrap gap-1">
                          {member.expertise.map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-blue-600/20 text-blue-300 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" className="w-full border-blue-400 text-blue-300 hover:bg-blue-400/10">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Shared Resources</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Share Resource
              </Button>
            </div>

            <div className="grid gap-4">
              {mockResources.map((resource) => (
                <Card key={resource.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg">{resource.title}</CardTitle>
                        <CardDescription className="text-gray-300 mt-1">
                          {resource.description}
                        </CardDescription>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-sm text-gray-400">by {resource.author}</span>
                          <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                            {resource.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{resource.downloads} downloads</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>
                      <Button variant="outline" className="border-blue-400 text-blue-300 hover:bg-blue-400/10">
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="networking" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Networking Events</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            <div className="grid gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                    Alumni Tech Showcase
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Present your latest projects and get feedback from fellow alumni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>March 15, 2024 • 6:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>Virtual Event</span>
                    </div>
                  </div>
                  <Button variant="outline" className="border-green-400 text-green-300 hover:bg-green-400/10">
                    Join Event
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Network className="w-5 h-5 mr-2 text-blue-400" />
                    Mentorship Speed Networking
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Connect with mentors and mentees in structured 10-minute sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>March 22, 2024 • 7:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>Atlanta Tech Village</span>
                    </div>
                  </div>
                  <Button variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-400/10">
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
