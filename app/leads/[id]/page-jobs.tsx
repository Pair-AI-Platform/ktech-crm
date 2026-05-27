'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Steve Jobs would say: "Design is not just what it looks like.
// Design is how it works."

export default function LeadDetailJobs() {
  const [showDetails, setShowDetails] = useState(false);

  const lead = {
    name: 'Amal Al-Mutairi',
    initials: 'AA',
    phone: '9983 0057',
    email: 'amal.mutairi@gmail.com',
    nationality: 'Kuwaiti',
    dob: 'Dec 14, 2004',
    age: 21,
    school: 'Grade 12 · Science',
    intendedMajor: 'Marketing',
    gpa: { grade10: 99.1, grade11: 91.5, average: 95.3 },
    source: 'Facebook',
    assignedTo: 'Aldana Ali',
    progress: 10,
    stage: 'New',
    created: 'Nov 17, 2025',
    lastUpdated: '2 days ago'
  };

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-black selection:text-white">
      {/* Minimal Navigation */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#fafafa]/80"
      >
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <button className="text-[13px] text-neutral-500 hover:text-black transition-colors flex items-center gap-2 group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Leads
          </button>
          <button className="text-[13px] px-4 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors">
            Edit
          </button>
        </div>
      </motion.nav>

      {/* Hero Section - The Person */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            {/* Avatar - Large, confident, centered */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center shadow-2xl shadow-neutral-400/30"
            >
              <span className="text-3xl font-light text-white tracking-wide">{lead.initials}</span>
            </motion.div>

            {/* Name - Typography as art */}
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-neutral-900 tracking-tight mb-4">
              {lead.name}
            </h1>

            {/* One line that says it all */}
            <p className="text-xl md:text-2xl text-neutral-400 font-light">
              {lead.age} · {lead.nationality} · {lead.intendedMajor}
            </p>

            {/* Contact - Subtle, accessible */}
            <div className="mt-8 flex items-center justify-center gap-8">
              <a href={`tel:${lead.phone}`} className="text-neutral-500 hover:text-black transition-colors text-sm">
                {lead.phone}
              </a>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <a href={`mailto:${lead.email}`} className="text-neutral-500 hover:text-black transition-colors text-sm">
                {lead.email}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Number That Matters - GPA */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400 mb-6">Academic Excellence</p>

            <div className="flex items-end justify-center gap-2">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[12rem] md:text-[16rem] font-extralight leading-none text-neutral-900 tracking-tighter"
              >
                {lead.gpa.average.toFixed(0)}
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-6xl md:text-8xl font-extralight text-neutral-300 mb-8"
              >
                .{(lead.gpa.average % 1).toFixed(1).split('.')[1]}
              </motion.span>
            </div>

            <p className="text-neutral-500 mt-4">Average GPA across Grade 10 & 11</p>

            {/* GPA Breakdown - Minimal */}
            <div className="mt-12 flex justify-center gap-16">
              <div className="text-center">
                <p className="text-4xl font-light text-neutral-700">{lead.gpa.grade10}</p>
                <p className="text-xs uppercase tracking-widest text-neutral-400 mt-2">Grade 10</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-light text-neutral-700">{lead.gpa.grade11}</p>
                <p className="text-xs uppercase tracking-widest text-neutral-400 mt-2">Grade 11</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Journey - Progress */}
      <section className="py-24 px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">Pipeline</p>
              <p className="text-sm text-neutral-500">{lead.progress}%</p>
            </div>

            {/* Progress Bar - Elegant */}
            <div className="h-[2px] bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${lead.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full bg-neutral-900 rounded-full"
              />
            </div>

            {/* Stage */}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-2xl font-light text-neutral-900">{lead.stage}</span>
              <span className="text-sm text-neutral-400">Created {lead.created}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Details - Progressive Disclosure */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-6 border-b border-neutral-200 group"
          >
            <span className="text-sm uppercase tracking-[0.3em] text-neutral-400">View All Details</span>
            <motion.svg
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </motion.svg>
          </motion.button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="py-12 grid grid-cols-2 md:grid-cols-3 gap-12">
                  <DetailItem label="Civil ID" value="260-2108-02414" />
                  <DetailItem label="Date of Birth" value={lead.dob} />
                  <DetailItem label="Nationality" value={lead.nationality} />
                  <DetailItem label="School" value="Other" />
                  <DetailItem label="Grade Level" value="12th" />
                  <DetailItem label="Academic Track" value="Science" />
                  <DetailItem label="Graduation Year" value="2026" />
                  <DetailItem label="ktech Intended Major" value={lead.intendedMajor} />
                  <DetailItem label="Lead Source" value={lead.source} />
                  <DetailItem label="Assigned To" value={lead.assignedTo} />
                  <DetailItem label="Created" value={lead.created} />
                  <DetailItem label="Last Updated" value={lead.lastUpdated} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer - Assignment */}
      <section className="py-12 px-8 border-t border-neutral-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
              <span className="text-xs font-medium text-white">AG</span>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">{lead.assignedTo}</p>
              <p className="text-xs text-neutral-400">Assigned Dec 7, 2025</p>
            </div>
          </div>
          <button className="text-sm text-neutral-500 hover:text-black transition-colors">
            Reassign
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
      <p className="text-lg font-light text-neutral-900">{value}</p>
    </div>
  );
}
