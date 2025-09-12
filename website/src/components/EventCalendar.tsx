
import React, { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface TechEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  organizer: 'Atlanta Tech Village' | 'Tech Alpharetta' | 'Render Atlanta';
  description: string;
  attendees?: number;
  registrationUrl?: string;
}

// Sample tech events data
const techEvents: TechEvent[] = [
  {
    id: '1',
    title: 'AI/ML Meetup: Building the Future',
    date: new Date(2025, 6, 20), // July 20, 2025
    time: '6:00 PM - 8:00 PM',
    location: 'Atlanta Tech Village',
    organizer: 'Atlanta Tech Village',
    description: 'Join us for an evening of AI and Machine Learning discussions with industry experts.',
    attendees: 45,
    registrationUrl: 'https://atlantatechvillage.com/events'
  },
  {
    id: '2',
    title: 'React & TypeScript Workshop',
    date: new Date(2025, 6, 18), // July 18, 2025
    time: '2:00 PM - 5:00 PM',
    location: 'Tech Alpharetta',
    organizer: 'Tech Alpharetta',
    description: 'Hands-on workshop covering advanced React patterns and TypeScript integration.',
    attendees: 30,
    registrationUrl: 'https://techalpharetta.com/events'
  },
  {
    id: '3',
    title: 'Startup Pitch Night',
    date: new Date(2025, 6, 25), // July 25, 2025
    time: '7:00 PM - 9:00 PM',
    location: 'Render Atlanta',
    organizer: 'Render Atlanta',
    description: 'Watch local startups pitch their ideas to investors and get feedback.',
    attendees: 80,
    registrationUrl: 'https://renderatl.com/events'
  },
  {
    id: '4',
    title: 'Cloud Architecture Summit',
    date: new Date(2025, 6, 22), // July 22, 2025
    time: '9:00 AM - 4:00 PM',
    location: 'Atlanta Tech Village',
    organizer: 'Atlanta Tech Village',
    description: 'Full-day conference on cloud architecture best practices and emerging trends.',
    attendees: 120,
    registrationUrl: 'https://atlantatechvillage.com/events'
  },
  {
    id: '5',
    title: 'Cybersecurity Bootcamp',
    date: new Date(2025, 6, 28), // July 28, 2025
    time: '10:00 AM - 6:00 PM',
    location: 'Tech Alpharetta',
    organizer: 'Tech Alpharetta',
    description: 'Intensive bootcamp covering cybersecurity fundamentals and hands-on labs.',
    attendees: 25,
    registrationUrl: 'https://techalpharetta.com/events'
  }
];

const EventCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const getEventsForDate = (date: Date) => {
    return techEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getEventDates = () => {
    return techEvents.map(event => event.date);
  };

  const getOrganizerColor = (organizer: string) => {
    switch (organizer) {
      case 'Atlanta Tech Village':
        return 'bg-blue-500/20 text-blue-300 border-blue-400';
      case 'Tech Alpharetta':
        return 'bg-purple-500/20 text-purple-300 border-purple-400';
      case 'Render Atlanta':
        return 'bg-green-500/20 text-green-300 border-green-400';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400';
    }
  };

  const upcomingEvents = techEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Tech Events Calendar</h2>
        <div className="flex space-x-2">
          <Button
            onClick={() => setViewMode('calendar')}
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            className={viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'border-blue-400 text-blue-300 hover:bg-blue-400/10'}
          >
            Calendar
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className={viewMode === 'list' ? 'bg-blue-600 text-white' : 'border-blue-400 text-blue-300 hover:bg-blue-400/10'}
          >
            List
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Event Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-white/20 bg-white/5 text-white"
                modifiers={{
                  hasEvent: getEventDates()
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: 'rgb(59 130 246 / 0.3)',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Events */}
          <div className="space-y-4">
            {selectedDate && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">
                    Events on {selectedDate.toLocaleDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-3">
                      {getEventsForDate(selectedDate).map(event => (
                        <div key={event.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white">{event.title}</h4>
                            <Badge className={getOrganizerColor(event.organizer)}>
                              {event.organizer}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-300">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {event.time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {event.location}
                            </div>
                            {event.attendees && (
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {event.attendees} attendees
                              </div>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-2">{event.description}</p>
                          {event.registrationUrl && (
                            <Button
                              size="sm"
                              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => window.open(event.registrationUrl, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Register
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No events scheduled for this date.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{event.title}</h4>
                        <Badge className={getOrganizerColor(event.organizer)}>
                          {event.organizer}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center mb-1">
                          <Clock className="w-4 h-4 mr-2" />
                          {event.date.toLocaleDateString()} • {event.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {techEvents
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(event => (
              <Card key={event.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                      <Badge className={getOrganizerColor(event.organizer)}>
                        {event.organizer}
                      </Badge>
                    </div>
                    {event.registrationUrl && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(event.registrationUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-300">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.date.toLocaleDateString()} • {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    {event.attendees && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {event.attendees} attendees
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-400">{event.description}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
