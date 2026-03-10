const Contact = () => {
    return (
        <div className="flex-1 w-full bg-white dark:bg-slate-900 py-24">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
                    <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">Get in Touch</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">Have questions about admissions? Fill out the form below and we'll contact you.</p>
                </div>

                <form className="space-y-6 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-8 rounded-2xl shadow-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Name</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl border-gray-200 dark:border-slate-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Your Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
                            <input type="email" className="w-full px-4 py-3 rounded-xl border-gray-200 dark:border-slate-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="your@email.com" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Message</label>
                        <textarea rows="4" className="w-full px-4 py-3 rounded-xl border-gray-200 dark:border-slate-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Your message..."></textarea>
                    </div>
                    <button type="button" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition">Send Message</button>
                </form>
            </div>
        </div>
    );
};
export default Contact;
