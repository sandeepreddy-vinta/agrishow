import React, { useState } from 'react';
import { Scissors, Crop, Type, Image as ImageIcon, Video, Play, Pause, Save } from 'lucide-react';

const ContentEditor = () => {
    const [activeTool, setActiveTool] = useState('trim'); // trim, crop, text
    const [isPlaying, setIsPlaying] = useState(false);

    // Mock video state
    const [trimRange, setTrimRange] = useState([0, 100]);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Content Editor</h1>
                    <p className="text-muted mt-1">Edit and enhance your media assets.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                    <Save size={20} />
                    <span>Save Copy</span>
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                {/* Tools Sidebar */}
                <div className="glass-panel p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
                    <button
                        onClick={() => setActiveTool('trim')}
                        className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTool === 'trim' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                    >
                        <Scissors size={20} />
                        <span className="font-medium whitespace-nowrap">Video Trim</span>
                    </button>
                    <button
                        onClick={() => setActiveTool('crop')}
                        className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTool === 'crop' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                    >
                        <Crop size={20} />
                        <span className="font-medium whitespace-nowrap">Crop Image</span>
                    </button>
                    <button
                        onClick={() => setActiveTool('text')}
                        className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTool === 'text' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                    >
                        <Type size={20} />
                        <span className="font-medium whitespace-nowrap">Add Overlay</span>
                    </button>
                </div>

                {/* Main Canvas */}
                <div className="lg:col-span-3 glass-panel p-6 flex flex-col relative overflow-hidden">
                    <div className="flex-1 bg-black/50 rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5">
                        {/* Mock Content */}
                        <div className="relative aspect-video w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden group">
                            {/* Overlay UI for Crop/Text would go here */}
                            {activeTool === 'crop' && (
                                <div className="absolute inset-x-20 inset-y-10 border-2 border-white/50 bg-black/20 z-10 cursor-move">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white -mb-1 -mr-1"></div>
                                </div>
                            )}

                            {activeTool === 'text' && (
                                <div className="absolute bottom-20 left-10 p-4 bg-black/40 backdrop-blur-sm rounded-lg border-2 border-primary border-dashed z-20 cursor-move text-4xl font-bold text-white">
                                    SUMMER SALE!
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Video size={64} className="text-white opacity-20" />
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Controls */}
                    <div className="mt-6">
                        {activeTool === 'trim' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted">
                                    <span>00:00</span>
                                    <span>00:15 / 00:45</span>
                                    <span>00:45</span>
                                </div>
                                <div className="h-12 bg-white/5 rounded-lg relative px-2 flex items-center">
                                    {/* Timeline Track */}
                                    <div className="absolute inset-x-4 h-2 bg-white/10 rounded-full"></div>
                                    <div className="absolute left-[20%] right-[20%] h-2 bg-primary rounded-full"></div>

                                    {/* Handles */}
                                    <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded cursor-ew-resize hover:scale-110 transition-transform"></div>
                                    <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded cursor-ew-resize hover:scale-110 transition-transform"></div>
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                                    >
                                        {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTool === 'text' && (
                            <div className="flex gap-4">
                                <input type="text" placeholder="Enter overlay text..." className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white" />
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 rounded bg-white/5 text-white font-bold">B</button>
                                    <button className="w-10 h-10 rounded bg-white/5 text-white italic">I</button>
                                    <div className="w-10 h-10 rounded bg-red-500 border border-white/20"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentEditor;
