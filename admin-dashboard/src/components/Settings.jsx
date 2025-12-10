import React from 'react';
import { Save, User, Bell, Shield, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsSection = ({ title, icon: Icon, children }) => (
    <div className="glass-panel p-6 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Icon size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        {children}
    </div>
);

const Settings = () => {
    const handleSave = () => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Saving changes...',
                success: 'Settings saved successfully!',
                error: 'Could not save settings.',
            }
        );
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-muted mt-1">Manage your application preferences and configuration.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                    <Save size={20} />
                    <span>Save Changes</span>
                </button>
            </div>

            <SettingsSection title="Profile Settings" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">Full Name</label>
                        <input type="text" defaultValue="Admin User" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">Email Address</label>
                        <input type="email" defaultValue="admin@franchiseos.com" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors" />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Notifications" icon={Bell}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                        <div>
                            <h4 className="text-white font-medium">Email Alerts</h4>
                            <p className="text-sm text-muted">Receive updates about franchise status.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-transparent" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                        <div>
                            <h4 className="text-white font-medium">Device Offline Alerts</h4>
                            <p className="text-sm text-muted">Get notified immediately when a screen goes offline.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-transparent" />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="API Configuration" icon={Globe}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">API Endpoint</label>
                        <input type="text" defaultValue="http://localhost:3000/api" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">API Key</label>
                        <div className="flex gap-2">
                            <input type="password" value="sk_test_123456789" readOnly className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-muted focus:outline-none focus:border-primary transition-colors" />
                            <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">Regenerate</button>
                        </div>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
};

export default Settings;
