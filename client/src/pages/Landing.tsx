import { Link } from 'react-router-dom';
import { Calendar, Clock, Shield, Activity, Heart, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="p-2.5 bg-teal-600 rounded-xl text-white shadow-sm transition-transform duration-300">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              AegisHealth
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors duration-200">Features</a>
            <a href="#about" className="hover:text-teal-600 transition-colors duration-200">About</a>
            <a href="#contact" className="hover:text-teal-600 transition-colors duration-200">Contact Support</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer">
              Sign In
            </Link>
            <Link to="/register" className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-xs text-teal-750 font-bold mb-3">
              <Heart className="h-3.5 w-3.5 fill-teal-500/10 text-teal-600" />
              A Better Way to Coordinate Medical Care
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
              Simpler Healthcare.<br />
              <span className="text-teal-600">Better Follow-Up.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Schedule medical consultations with top practitioners, track doctor leaves, receive proactive prescription updates, and coordinate checkups in one intuitive, secure platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white shadow-md shadow-teal-600/10 transition-all text-center flex items-center justify-center space-x-1.5"
              >
                <span>Book an Appointment</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 transition-all text-center"
              >
                Explore Doctors
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Designed for Optimal Patient Experience
              </h2>
              <p className="text-slate-500 text-sm">
                A streamlined solution providing doctors and patients with simple tools to manage health records and follow-up activities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl w-fit">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Easy Appointment Scheduling</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Book and reschedule consultations with selected doctors based on real-time availability blocks, avoiding double-bookings.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl w-fit">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Doctor Leave & Availability</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review medical practitioner working hours, and get automated notifications if a doctor schedules a leave period.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl w-fit">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Secure Patient Records</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Manage patient profiles, secure credential access, and verify appointments history in compliance with strict privacy standards.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Feature 4 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 flex items-start space-x-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Medication Reminders</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automatically schedules SMS/email reminders at UTC timestamps mapping to your prescription dosage instructions.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 flex items-start space-x-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">AI-assisted Pre-visit Support</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Uses secure LLM abstractions to summarize patient symptoms, gauge urgency levels, and prepare clinical checklists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-slate-50 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About AegisHealth</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              AegisHealth is a trusted, enterprise-grade healthcare SaaS platform that bridges the communication gap between medical practitioners and patients. We focus on reliable scheduling, accurate leaving records, automated notifications, and AI pre-visit support to optimize patient outcomes.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AegisHealth Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
