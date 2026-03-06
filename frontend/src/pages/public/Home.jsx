import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white min-h-[600px] flex items-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center w-full">
                    <div className="space-y-8 animate-in slide-in-from-bottom flex flex-col items-start duration-700">
                        <span className="px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 text-sm font-semibold border border-blue-400/30">
                            Excellence in Education
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">True Potential</span>
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 max-w-lg leading-relaxed">
                            Join our premier tuition center dedicated to academic excellence, personalized learning, and student success.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/courses" className="px-8 py-4 bg-white text-blue-900 font-bold rounded-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 flex items-center gap-2">
                                Explore Courses <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/contact" className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition duration-300">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">Why Choose Us?</h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">We provide a comprehensive learning environment designed to help every student thrive.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: BookOpen, title: 'Expert Faculty', desc: 'Learn from highly qualified educators with years of experience.' },
                            { icon: Users, title: 'Small Batches', desc: 'Personalized attention with optimal student-to-teacher ratios.' },
                            { icon: Trophy, title: 'Proven Results', desc: 'Outstanding track record of top grades and student achievements.' },
                        ].map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div key={i} className="group p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-2xl hover:border-blue-100 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                                    <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
};
export default Home;
