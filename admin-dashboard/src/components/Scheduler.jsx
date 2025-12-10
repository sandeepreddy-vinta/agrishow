import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

const Scheduler = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // week, month
    const [events, setEvents] = useState([
        { id: 1, title: 'Morning Playlist', start: new Date().setHours(8, 0), end: new Date().setHours(11, 0), color: 'bg-primary' },
        { id: 2, title: 'Lunch Special', start: new Date().setHours(11, 30), end: new Date().setHours(14, 0), color: 'bg-secondary' },
        { id: 3, title: 'Evening Ambience', start: new Date().setHours(17, 0), end: new Date().setHours(22, 0), color: 'bg-accent' },
    ]);

    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

    const handlePrev = () => setCurrentDate(prev => addDays(prev, -7));
    const handleNext = () => setCurrentDate(prev => addDays(prev, 7));

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Content Scheduler</h1>
                    <p className="text-muted mt-1">Manage when your content plays.</p>
                </div>
                <div className="flex items-center gap-4 bg-surface/30 p-2 rounded-xl backdrop-blur-md border border-white/5">
                    <button onClick={handlePrev} className="p-2 hover:bg-white/5 rounded-lg text-white"><ChevronLeft size={20} /></button>
                    <div className="flex items-center gap-2 text-white font-medium min-w-[140px] justify-center">
                        <CalendarIcon size={18} className="text-primary" />
                        <span>{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</span>
                    </div>
                    <button onClick={handleNext} className="p-2 hover:bg-white/5 rounded-lg text-white"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="flex-1 glass-panel overflow-hidden flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-white/5">
                    <div className="p-4 border-r border-white/5 text-muted font-medium text-sm">Time</div>
                    {days.map(day => (
                        <div key={day.toString()} className={`p-4 text-center border-r border-white/5 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''}`}>
                            <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-primary' : 'text-muted'}`}>{format(day, 'EEE')}</div>
                            <div className={`text-xl font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-white'}`}>{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 min-h-[80px] border-b border-white/5">
                            {/* Time Label */}
                            <div className="p-2 border-r border-white/5 text-xs text-muted text-right pr-4 sticky left-0 bg-[#1e293b]/90 backdrop-blur-sm z-10 w-full h-full flex items-start justify-end">
                                {format(new Date().setHours(hour, 0), 'ha')}
                            </div>

                            {/* Slots */}
                            {days.map(day => (
                                <div key={`${day}-${hour}`} className="relative border-r border-white/5 last:border-r-0 hover:bg-white/5 transition-colors group">
                                    <button className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={16} className="text-primary" />
                                    </button>

                                    {/* Render Events */}
                                    {events.filter(e => isSameDay(new Date(e.start), day) && new Date(e.start).getHours() === hour).map(event => (
                                        <div
                                            key={event.id}
                                            className={`absolute inset-x-1 top-1 bottom-1 ${event.color} rounded-lg p-2 text-xs text-white overflow-hidden shadow-lg border border-white/10 z-20 cursor-pointer hover:opacity-90`}
                                        >
                                            <div className="flex items-center gap-1 font-bold mb-1">
                                                <Play size={10} fill="currentColor" />
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                            <div className="text-white/80 opacity-75">
                                                {format(new Date(event.start), 'h:mm')} - {format(new Date(event.end), 'h:mm')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Scheduler;
