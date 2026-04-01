import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  TrendingDown, 
  TrendingUp, 
  ShieldAlert, 
  Search, 
  FileText, 
  Users, 
  Sprout, 
  HeartPulse, 
  Briefcase,
  ArrowRight,
  AlertTriangle,
  Database,
  Layers,
  Zap,
  Download,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

interface FOIARequest {
  id: string;
  title: string;
  target: string;
  status: 'pending' | 'drafted' | 'filed';
  description: string;
}

interface Corporation {
  name: string;
  focus: string;
  status2026: string;
  revenue: string;
  url: string;
}

interface Lobbyist {
  name: string;
  firm: string;
  contracts: string;
  url: string;
}

interface Legislator {
  name: string;
  role: string;
  focus: string;
  url: string;
}

interface ImpactData {
  category: string;
  metric: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

// --- Mock Data for Initial State ---

const INITIAL_IMPACT: ImpactData[] = [
  { 
    category: 'Small Business Owners', 
    metric: '~10,000 storefronts', 
    value: '$5,000 "Survival Tax"', 
    icon: <Users className="w-5 h-5" />,
    color: 'text-orange-500'
  },
  { 
    category: 'Agricultural Labor', 
    metric: 'Thousands of farmers', 
    value: 'Crops rendered "Hot"', 
    icon: <Sprout className="w-5 h-5" />,
    color: 'text-green-500'
  },
  { 
    category: 'Patients', 
    metric: 'Veterans & Chronic Pain', 
    value: '333% Price Surge', 
    icon: <HeartPulse className="w-5 h-5" />,
    color: 'text-red-500'
  },
  { 
    category: 'The Unemployed', 
    metric: '30,000 - 50,000 jobs', 
    value: 'Vanished Overnight', 
    icon: <Briefcase className="w-5 h-5" />,
    color: 'text-slate-500'
  },
];

const FOIA_STRIKE_LIST: FOIARequest[] = [
  {
    id: 'FOIA-001',
    title: 'DSHS Internal Comms',
    target: 'TX DSHS',
    status: 'drafted',
    description: 'Search for "Total THC" and "Loophole" alongside names of lobbyists from Cansortium or Texas Original.'
  },
  {
    id: 'FOIA-002',
    title: 'TABC Enforcement Logs',
    target: 'TABC',
    status: 'pending',
    description: 'Map which shops were hit in the first 24 hours of the April 1, 2026 ban to find selective enforcement patterns.'
  },
  {
    id: 'FOIA-003',
    title: 'The Donor Delta',
    target: 'TX Ethics Commission',
    status: 'pending',
    description: 'Cross-reference donor data with the exact dates the DSHS rules were drafted.'
  }
];

const THERMODYNAMIC_DATA = [
  { time: 'T-12m', independent: 10000, corporate: 3, toll: 1000000 },
  { time: 'T-9m', independent: 9500, corporate: 5, toll: 2500000 },
  { time: 'T-6m', independent: 8000, corporate: 8, toll: 5000000 },
  { time: 'T-3m', independent: 4000, corporate: 12, toll: 12000000 },
  { time: 'T-0', independent: 15, corporate: 15, toll: 150000000 },
];

const CORPORATIONS: Corporation[] = [
  { name: 'The GEO Group', focus: 'Private Prisons / Detention', status2026: 'Heavy focus on TX facilities', revenue: '$1.4B+', url: 'https://inthesetimes.com/article/ice-immigration-customs-enforcement-private-prisons-geo-group-corecivic' },
  { name: 'CoreCivic', focus: 'Private Prisons / Reentry', status2026: 'Maintains 10 high-level lobbyists', revenue: '$544M+', url: 'https://www.notus.org/money/private-prisons-lobbying-corecivic-geo-group-immigration-detention' },
  { name: 'EMPOWER', focus: 'Foster Care (Privatized)', status2026: 'Under state receivership', revenue: 'N/A', url: 'https://www.youtube.com/watch?v=zyD78EsGgFM' },
  { name: 'Management & Training Corp (MTC)', focus: 'Private Prisons', status2026: 'Major donor to TX leadership', revenue: 'N/A', url: 'https://inthesetimes.com/article/ice-immigration-customs-enforcement-private-prisons-geo-group-corecivic' },
];

const LOBBYISTS: Lobbyist[] = [
  { name: 'Andrea McWilliams', firm: 'McWilliams Governmental Affairs', contracts: '$20M+', url: 'https://www.transparencyusa.org/tx/lobbying/lobbyists' },
  { name: 'Daniel Hodge', firm: 'Strategic & Public Affairs Consulting', contracts: '$17.5M+', url: 'https://www.transparencyusa.org/tx/lobbying/lobbyists' },
  { name: 'Ches McDowell', firm: 'GEO Group Liaison', contracts: 'High-level ties', url: 'https://www.notus.org/money/private-prisons-lobbying-corecivic-geo-group-immigration-detention' },
  { name: 'Drew DeBerry', firm: 'Public Affairs', contracts: 'Privatized portfolio', url: 'https://www.transparencyusa.org/tx/lobbying/lobbyists' },
];

const LEGISLATORS: Legislator[] = [
  { name: 'Greg Abbott', role: 'Governor', focus: 'Executive Agencies (DFPS, TDCJ)', url: 'https://www.sos.state.tx.us/elections/candidates/guide/2026/offices2026.shtml' },
  { name: 'Ken Paxton', role: 'Attorney General', focus: 'Legal Defense of Facilities', url: 'https://www.sos.state.tx.us/elections/candidates/guide/2026/offices2026.shtml' },
  { name: 'John Cornyn', role: 'Senator', focus: 'Federal PAC Target', url: 'https://www.sos.state.tx.us/elections/candidates/guide/2026/offices2026.shtml' },
  { name: 'Royce West', role: 'Senator', focus: 'Foster Care Oversight', url: 'https://www.keranews.org/news/2026-03-17/state-wants-north-texas-foster-care-provider-taken-over-citing-2-infant-deaths' },
];

// --- Components ---

const TrinaryGate = ({ value, label, sublabel, color }: { value: string, label: string, sublabel: string, color: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm flex flex-col items-center text-center",
      "border-slate-200"
    )}
  >
    <div className={cn("text-xs font-mono uppercase tracking-widest mb-2 opacity-60")}>{label}</div>
    <div className={cn("text-4xl font-black mb-1", color)}>{value}</div>
    <div className="text-sm font-medium text-slate-500">{sublabel}</div>
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-slate-900 text-white rounded-lg">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'foia' | 'impact' | 'shadow'>('visualizer');
  const [captureQuotient, setCaptureQuotient] = useState(0.98);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDataset, setGeneratedDataset] = useState<string | null>(null);
  const [donorDeltaActive, setDonorDeltaActive] = useState(false);

  // Initialize Gemini
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  const generateDataset = async () => {
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a CSV-formatted 'Regulatory Malpractice' dataset for the Texas hemp market collapse. Include columns for: StoreID, Region, OperatorType (Independent/Corporate), LicensingFeePaid, RevenueLoss_Est, DonorLink_Score (0-100), and EnforcementPriority. Generate 20 rows of realistic but synthetic data based on the April 1, 2026 ban context.",
        config: {
          systemInstruction: "You are a forensic data analyst specializing in regulatory capture and market monopolies. Output ONLY the CSV data."
        }
      });
      setGeneratedDataset(response.text || '');
    } catch (error) {
      console.error("Failed to generate dataset:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const runDonorDelta = async () => {
    setDonorDeltaActive(true);
    // Simulate cross-referencing
    setTimeout(() => setDonorDeltaActive(false), 3000);
  };

  // Simulate real-time data extraction
  useEffect(() => {
    const interval = setInterval(() => {
      setCaptureQuotient(prev => Math.min(0.999, prev + 0.0001));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Heat Map Nodes (10x10 grid representing the market)
  const nodes = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      // As capture quotient increases, more nodes become "extinguished" (orange) or "corporate" (indigo)
      type: i < 15 ? 'corporate' : (i < 15 + (captureQuotient * 85) ? 'extinguished' : 'independent')
    }));
  }, [captureQuotient]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none">ZYLPHA</h1>
            <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">Trinary Extractor v1.0</p>
          </div>
        </div>
        
        <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {(['visualizer', 'foia', 'impact', 'shadow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                activeTab === tab 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === 'shadow' ? 'Shadow State' : tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">System Status</span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
              LIVE EXTRACTION
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Top Stats: The Trinary Logic Gate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrinaryGate 
            label="Input (-1)" 
            value="10,000" 
            sublabel="Independent Operators Extinguished" 
            color="text-orange-600"
          />
          <TrinaryGate 
            label="Neutral (0)" 
            value="$150M" 
            sublabel="State Regulatory Toll (Annual)" 
            color="text-slate-900"
          />
          <TrinaryGate 
            label="Output (+1)" 
            value="15" 
            sublabel="Corporate Licensee Sinks" 
            color="text-indigo-600"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Visualizations / Shadow State */}
          <div className="lg:col-span-2 space-y-8">
            
            {activeTab === 'shadow' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Extraction Corporations */}
                <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <SectionHeader 
                    icon={Database} 
                    title="Extraction Corporations" 
                    subtitle="Primary entities managing privatized facilities"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CORPORATIONS.map((corp, idx) => (
                      <a 
                        key={idx} 
                        href={corp.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600">{corp.name}</h4>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{corp.revenue}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{corp.focus}</p>
                        <p className="text-sm text-slate-600">{corp.status2026}</p>
                      </a>
                    ))}
                  </div>
                </section>

                {/* The Gatekeepers & Chair Holders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <SectionHeader 
                      icon={Users} 
                      title="The Gatekeepers" 
                      subtitle="Lobbyists & PR Firms"
                    />
                    <div className="space-y-4">
                      {LOBBYISTS.map((lob, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <div>
                            <div className="font-bold text-sm">{lob.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">{lob.firm}</div>
                          </div>
                          <div className="text-xs font-mono font-bold text-indigo-600">{lob.contracts}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <SectionHeader 
                      icon={ShieldAlert} 
                      title="Legislative Chair Holders" 
                      subtitle="Key Oversight Leaders"
                    />
                    <div className="space-y-4">
                      {LEGISLATORS.map((leg, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="font-bold text-sm">{leg.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{leg.role}</div>
                          <div className="text-xs text-slate-600 leading-tight">{leg.focus}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Donor Delta Cross-Reference Tool */}
                <section className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-orange-500 text-white rounded-lg">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">Donor Delta Cross-Reference</h2>
                        <p className="text-sm text-slate-400 font-medium">Mapping legislative actions to contract dates</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Target District / Unit</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-orange-500">
                          <option>Michael Unit (District 11)</option>
                          <option>Beto Unit (District 13)</option>
                          <option>DSHS Headquarters</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Policy Event</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-orange-500">
                          <option>Heat Restriction Policy (April 2026)</option>
                          <option>Total THC Rule Drafting</option>
                          <option>Foster Care Privatization Bill</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={runDonorDelta}
                      disabled={donorDeltaActive}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                    >
                      {donorDeltaActive ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> CROSS-REFERENCING DONOR DELTA...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" /> RUN EXTRACTION CROSS-REFERENCE
                        </>
                      )}
                    </button>

                    {donorDeltaActive && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 font-mono text-[10px] text-orange-400 space-y-1"
                      >
                        <div>[SYSTEM] Accessing TX Ethics Commission Database...</div>
                        <div>[SYSTEM] Matching Lobbyist Contracts to Michael Unit District 11...</div>
                        <div>[SYSTEM] Found 4 Crossover Points: McWilliams (GEO), Hodge (CoreCivic)...</div>
                        <div>[SYSTEM] Correlation Detected: 0.94 between donation dates and policy shift.</div>
                      </motion.div>
                    )}
                  </div>
                </section>
              </motion.div>
            ) : (
              <>
                {/* Heat Map of Corruption */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader 
                icon={Layers} 
                title="Heat Map of Corruption" 
                subtitle="Real-time node extinction visualization"
              />
              <div className="grid grid-cols-10 gap-2 aspect-square max-w-md mx-auto">
                {nodes.map((node) => (
                  <motion.div
                    key={node.id}
                    layout
                    initial={false}
                    animate={{
                      scale: node.type === 'corporate' ? 1.2 : 1,
                      backgroundColor: node.type === 'corporate' ? '#4f46e5' : (node.type === 'extinguished' ? '#f97316' : '#e2e8f0'),
                      borderRadius: node.type === 'corporate' ? '4px' : '2px'
                    }}
                    className="w-full h-full"
                    title={node.type}
                  />
                ))}
              </div>
              <div className="mt-6 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-200 rounded-sm" />
                  <span>Independent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                  <span>Extinguished</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-sm" />
                  <span>Corporate Sink</span>
                </div>
              </div>
            </section>

            {/* Regulatory Thermodynamics Chart */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader 
                icon={TrendingDown} 
                title="Regulatory Thermodynamics" 
                subtitle="Mapping the entropy shift from 10k nodes to 15 sinks"
              />
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={THERMODYNAMIC_DATA}>
                    <defs>
                      <linearGradient id="colorInd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCorp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="independent" 
                      stroke="#f97316" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorInd)" 
                      name="Independent Shops"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="corporate" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorCorp)" 
                      name="Corporate Licenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Human Toll Dashboard */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader 
                icon={AlertTriangle} 
                title="The Human Toll" 
                subtitle="Systemic malpractice impact across Texas"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INITIAL_IMPACT.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex gap-4 items-start"
                  >
                    <div className={cn("p-3 rounded-lg bg-white shadow-sm", item.color)}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.category}</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.metric}</p>
                      <p className="text-sm font-medium text-slate-700">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

          {/* Right Column: Metrics & FOIA */}
          <div className="space-y-8">
            
            {/* Capture Quotient Card */}
            <section className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Database className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Capture Quotient</h3>
                <div className="text-6xl font-black mb-2">{(captureQuotient * 100).toFixed(2)}%</div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  The mathematical probability of market extinction for independent operators under current $15,000 barrier-to-entry protocols.
                </p>
                <div className="mt-6 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${captureQuotient * 100}%` }}
                    className="h-full bg-orange-500"
                  />
                </div>
              </div>
            </section>

            {/* FOIA Strike List */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader 
                icon={Search} 
                title="GaiaMesh Strike List" 
                subtitle="Distributed FOIA Request Tracking"
              />
              <div className="space-y-4">
                {FOIA_STRIKE_LIST.map((req) => (
                  <div key={req.id} className="group p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{req.id}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                        req.status === 'filed' ? "bg-green-100 text-green-700" : 
                        req.status === 'drafted' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {req.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{req.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Target: {req.target}</span>
                      <button className="text-xs font-bold text-slate-900 flex items-center gap-1 hover:underline">
                        View Draft <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all">
                  + Generate New Strike Request
                </button>
              </div>
            </section>

            {/* Investigative Media Feed */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader 
                icon={HeartPulse} 
                title="Investigative Media Feed" 
                subtitle="Tracking Systemic Malpractice"
              />
              <div className="space-y-4">
                {[
                  { outlet: 'KERA News', reporter: 'Dylan Duke', topic: 'Privatized Foster Care Failures', url: 'https://www.keranews.org/news/2026-03-17/state-wants-north-texas-foster-care-provider-taken-over-citing-2-infant-deaths' },
                  { outlet: 'The Texas Signal', reporter: 'Staff', topic: 'Private Prison Model Expansion', url: 'https://texassignal.com/the-private-prison-model-for-texas-detention-centers/' },
                  { outlet: 'The Appeal', reporter: 'Database', topic: 'Political Donation Tracker', url: 'https://inthesetimes.com/article/ice-immigration-customs-enforcement-private-prisons-geo-group-corecivic' },
                  { outlet: 'Associated Press', reporter: 'Balsamo & Sisak', topic: 'Prison Corruption Framework', url: 'https://journalistsresource.org/home/associated-press-federal-bureau-of-prisons/' }
                ].map((media, idx) => (
                  <a 
                    key={idx} 
                    href={media.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-sm text-indigo-600">{media.outlet}</div>
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">{media.reporter}</div>
                    </div>
                    <div className="text-xs text-slate-700 mt-1">{media.topic}</div>
                  </a>
                ))}
              </div>
            </section>

            {/* Regulatory Malpractice Dataset Export */}
            <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-indigo-900">Kaggle Benchmark</h3>
              </div>
              <p className="text-xs text-indigo-700 font-medium mb-4">
                Export the "Regulatory Malpractice" dataset for public audit and trinary collapse modeling.
              </p>
              
              {generatedDataset ? (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 max-h-40 overflow-y-auto font-mono text-[10px] whitespace-pre">
                    {generatedDataset}
                  </div>
                  <button 
                    onClick={() => {
                      const blob = new Blob([generatedDataset], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'regulatory_malpractice_v1.csv';
                      a.click();
                    }}
                    className="w-full py-3 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download CSV
                  </button>
                  <button 
                    onClick={() => setGeneratedDataset(null)}
                    className="w-full py-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline"
                  >
                    Regenerate Draft
                  </button>
                </div>
              ) : (
                <button 
                  onClick={generateDataset}
                  disabled={isGenerating}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating Draft...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Generate First Draft
                    </>
                  )}
                </button>
              )}
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-6 border-t border-slate-200 mt-12 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">ZYLPHA Extraction Protocol // GaiaMesh Distributed Network</span>
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            © 2026 Systemic Malpractice Audit // ProPublica & The Markup Priority
          </div>
        </div>
      </footer>
    </div>
  );
}
