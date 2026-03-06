import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

const EventModal = ({ isOpen, onClose, event, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description || '',
                // Format date as YYYY-MM-DD for input type="date"
                event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({ title: '', description: '', event_date: '' });
        }
    }, [event]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (event) {
                await api.put(`/admin/events/${event.id}`, formData);
            } else {
                await api.post('/admin/events', formData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-colors duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 transition-colors duration-200">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                        {event ? 'Edit Event' : 'Add New Event'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-100 dark:border-red-800/50">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder="E.g., Summer Holiday"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleChange}
                                required
                                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder="Provide brief details about the event..."
                            ></textarea>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This will be broadcasted as a notice to all users.</p>
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {event ? 'Save Changes' : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
