import React, { useState } from 'react';
import { X, Upload, File } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        onClose(); // Close first, let the background toast handle progress/status
        onUpload(files);
        setUploading(false);
        setFiles([]);
        setProgress(0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Upload Content</h2>
                    <button onClick={onClose} className="text-muted hover:text-white"><X size={20} /></button>
                </div>

                {/* Drop Zone */}
                <div
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-white/5"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                        <Upload size={24} />
                    </div>
                    <p className="text-white font-medium mb-1">Drag & drop files here</p>
                    <p className="text-sm text-muted mb-4">or click to browse</p>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileInput}
                        accept="image/*,video/*"
                    />
                    <label
                        htmlFor="file-upload"
                        className="px-4 py-2 bg-white/10 text-white rounded-lg cursor-pointer hover:bg-white/20 transition-colors text-sm"
                    >
                        Browse Files
                    </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-6 space-y-3 max-h-48 overflow-y-auto">
                        <h3 className="text-sm font-medium text-muted">Selected Files ({files.length})</h3>
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                <File size={16} className="text-primary" />
                                <span className="text-sm text-white truncate flex-1">{file.name}</span>
                                <button onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))} className="text-muted hover:text-error">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress */}
                {uploading && (
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white">Uploading...</span>
                            <span className="text-muted">{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
