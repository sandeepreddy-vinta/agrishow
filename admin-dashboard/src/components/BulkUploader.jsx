import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const BulkUploader = () => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = (file) => {
        // Simple CSV parser for demo
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const data = lines.slice(1).map((line, idx) => {
                const [name, location, ip] = line.split(',');
                if (!name) return null;
                return { id: idx, name: name.trim(), location: location?.trim(), ip: ip?.trim(), status: 'pending' };
            }).filter(Boolean);
            setPreview(data);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "text/csv") {
                setFile(droppedFile);
                processFile(droppedFile);
            } else {
                toast.error('Please upload a CSV file');
            }
        }
    };

    const handleImport = async () => {
        setUploading(true);
        await new Promise(r => setTimeout(r, 1500));
        setUploading(false);
        toast.success(`Successfully imported ${preview.length} franchises!`);
        setFile(null);
        setPreview([]);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white">Bulk Operations</h1>
                <p className="text-muted mt-1">Import franchises and manage data in bulk.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Area */}
                <div className="space-y-4">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Import CSV</h3>
                        <div
                            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload size={32} className="mx-auto text-muted mb-4" />
                            <p className="text-white font-medium">Drag & Drop CSV File</p>
                            <p className="text-sm text-muted mt-2">Format: Name, Location, IP Address</p>

                            <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
                                Browse Files
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Export Tools</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors group">
                                <FileText size={24} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-white">Export Analytics</div>
                                <div className="text-xs text-muted">PDF Report</div>
                            </button>
                            <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors group">
                                <Database size={24} className="text-secondary mb-2 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-white">Export Data</div>
                                <div className="text-xs text-muted">Full JSON Backup</div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="glass-panel p-6 flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Import Preview</h3>
                        {preview.length > 0 && (
                            <span className="text-sm text-muted">{preview.length} items found</span>
                        )}
                    </div>

                    {preview.length > 0 ? (
                        <>
                            <div className="flex-1 overflow-y-auto mb-4 border border-white/5 rounded-lg">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-muted">Name</th>
                                            <th className="p-3 text-muted">Location</th>
                                            <th className="p-3 text-muted">IP</th>
                                            <th className="p-3 text-muted">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {preview.map((row, i) => (
                                            <tr key={i}>
                                                <td className="p-3 text-white">{row.name}</td>
                                                <td className="p-3 text-muted">{row.location}</td>
                                                <td className="p-3 text-muted">{row.ip}</td>
                                                <td className="p-3">
                                                    <span className="text-success flex items-center gap-1 text-xs">
                                                        <CheckCircle size={10} /> Valid
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button onClick={() => { setFile(null); setPreview([]); }} className="px-4 py-2 text-muted hover:text-white">Cancel</button>
                                <button
                                    onClick={handleImport}
                                    disabled={uploading}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                                >
                                    {uploading ? 'Importing...' : 'Confirm Import'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted">
                            <FileText size={48} className="opacity-20 mb-4" />
                            <p>No file selected</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUploader;
