import React, { useState, useEffect } from 'react';
import {
  Activity,
  Brain,
  FileText,
  MapPin,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  User,
  Info
} from 'lucide-react';
import SankeyPathway from "./SankeyPathway.jsx";


// --- Data Models (Moved outside component to ensure stability) ---

const SCENARIOS = {
  standard: {
    id: 'standard',
    name: 'Standard Logistics Support',
    description: 'A standard 4-year enlistment with one deployment to a low-threat environment. No injuries sustained.',
    events: ['tapas', 'enlist', 'pha_y1', 'anam', 'deploy_start', 'pdha', 'deploy_end', 'pdhra', 'pha_y3', 'separation']
  },
  combat_injury: {
    id: 'combat_injury',
    name: 'Infantry w/ Blast Injury',
    description: 'Combat arms role with a deployment involving an IED blast exposure and mild TBI diagnosis.',
    events: ['tapas', 'enlist', 'pha_y1', 'anam', 'hma', 'deploy_start', 'blast_event', 'mace2', 'pdha_pos', 'deploy_end', 'pdhra_pos', 'pha_y3_nmr', 'separation']
  },
  admin_gap: {
    id: 'admin_gap',
    name: 'Readiness Gap Scenario',
    description: 'Shows the administrative impact of missing the Periodic Health Assessment (PHA) window.',
    events: ['tapas', 'enlist', 'pha_y1', 'anam', 'deploy_start', 'pdha', 'deploy_end', 'pdhra', 'pha_missed', 'mrc4_alert', 'separation']
  }
};

const EVENT_DATABASE = {
  tapas: {
    title: "TAPAS & Accession Testing",
    month: 0,
    type: "Screening",
    location: "MEPS (Garrison)",
    systems: ["AI/Accession Data", "Person-Event Data Environment (PDE)"],
    description: "The Tailored Adaptive Personality Assessment System (TAPAS) is administered during processing. It measures personality facets (e.g., dominance, sociability) to predict resilience and fit. While not a clinical tool, it establishes the earliest pre-service behavioral baseline.",
    icon: User
  },
  enlist: {
    title: "Enlistment & Basic Training",
    month: 1,
    type: "Milestone",
    location: "Garrison",
    systems: ["DMDC", "DEERS"],
    description: "Service member formally enters the system. Demographic data flows into the Defense Manpower Data Center (DMDC), establishing the identity for all future medical records.",
    icon: Shield
  },
  pha_y1: {
    title: "Annual PHA (Year 1)",
    month: 12,
    type: "Readiness",
    location: "Garrison",
    systems: ["MODS", "MEDPROS", "MHS GENESIS"],
    description: "The Periodic Health Assessment (PHA) is the primary driver of medical readiness. A self-assessment is completed, followed by a provider review. Completion updates the Medical Protection System (MEDPROS) to MRC 1 (Medically Ready).",
    icon: CheckCircle
  },
  anam: {
    title: "ANAM Baseline",
    month: 16,
    type: "Cognitive",
    location: "Garrison",
    systems: ["ANAM Repository", "DoD Central Rep", "MHS GENESIS (Viewable)"],
    description: "Mandated within 12 months prior to deployment. The Automated Neuropsychological Assessment Metrics (ANAM) establishes a neurocognitive baseline (reaction time, memory, processing speed). Results are stored in a central repository for future comparison post-injury.",
    icon: Brain
  },
  hma: {
    title: "Hostile Mission Assessment (HMA)",
    month: 17,
    type: "Psychological",
    location: "Garrison",
    systems: ["MHS GENESIS", "Local Medical Files"],
    description: "A specialized psychological screening for high-risk or special operations roles. It assesses suitability for isolated or hostile environments, looking for sub-clinical indicators that might degrade performance under extreme stress.",
    icon: Activity
  },
  deploy_start: {
    title: "Deployment to Theater",
    month: 18,
    type: "Movement",
    location: "Theater",
    systems: ["DMDC", "TRAC2ES"],
    description: "Service member enters the area of operations. Location data begins tracking in theater systems, which is crucial for later linking exposures (ILER) to the individual.",
    icon: MapPin
  },
  blast_event: {
    title: "IED / Blast Exposure",
    month: 22,
    type: "Exposure",
    location: "Theater (Combat)",
    systems: ["ILER", "Blast Gauge (if equipped)", "DOEHRS-IH"],
    description: "Service member is exposed to a blast event. Blast sensors (if worn) record psi pressure. Unit location data and SIGACT reports are aggregated into the Individual Longitudinal Exposure Record (ILER) as a Tier 1 or 2 exposure event.",
    icon: AlertTriangle
  },
  mace2: {
    title: "Point of Injury: MACE 2",
    month: 22.1,
    type: "Clinical",
    location: "Theater (Role 1/2)",
    systems: ["TMDS", "MDR", "MHS GENESIS"],
    description: "Military Acute Concussion Evaluation 2 (MACE 2) is performed by a medic or provider. The encounter is logged in the Theater Medical Data Store (TMDS). This data pushes to the MHS Data Repository (MDR) and eventually to MHS GENESIS.",
    icon: Activity
  },
  pdha: {
    title: "PDHA (DD 2796)",
    month: 27,
    type: "Screening",
    location: "Theater/Garrison",
    systems: ["eDHA", "MEDPROS", "DMSS"],
    description: "Post-Deployment Health Assessment. Administered +/- 30 days of return. Screens for blast exposure, TBI symptoms (4-stage logic), and mental health. A 'clean' screen maintains MRC 1 status.",
    icon: FileText
  },
  pdha_pos: {
    title: "PDHA (Positive Screen)",
    month: 27,
    type: "Screening",
    location: "Theater/Garrison",
    systems: ["eDHA", "MEDPROS", "MHS GENESIS"],
    description: "User flags positive for TBI or Mental Health issues on DD 2796. This triggers a mandatory referral. Data flows to MEDPROS to flag potential readiness issues. Research shows a positive screen increases odds of future Non-Medically Ready (MRC 3) status by 54%.",
    icon: AlertTriangle
  },
  deploy_end: {
    title: "Return to Home Station",
    month: 27.5,
    type: "Movement",
    location: "Garrison",
    systems: ["DMDC"],
    description: "End of deployment. The 'Window of Vulnerability' begins here (2-8 weeks post-return), where cognitive deficits may persist even if symptoms abate.",
    icon: MapPin
  },
  pdhra: {
    title: "PDHRA (DD 2900)",
    month: 31,
    type: "Screening",
    location: "Garrison",
    systems: ["eDHA", "MEDPROS", "DMSS"],
    description: "Post-Deployment Health Reassessment. Completed 90-180 days post-return to catch delayed symptom emergence (PTSD/TBI overlap). Validated by a provider.",
    icon: FileText
  },
  pdhra_pos: {
    title: "PDHRA (Positive - Referral)",
    month: 31,
    type: "Clinical",
    location: "Garrison",
    systems: ["MHS GENESIS", "e-Profile"],
    description: "Symptoms persisted or emerged late. Provider places a Temporary Profile in e-Profile (DA Form 3349). This updates MEDPROS to DL 1 (Deployment Limiting) and changes status to MRC 3 (Not Medically Ready).",
    icon: AlertTriangle
  },
  pha_y3: {
    title: "Annual PHA (Year 3)",
    month: 36,
    type: "Readiness",
    location: "Garrison",
    systems: ["MEDPROS"],
    description: "Routine annual check. Ensures all IMR (Individual Medical Readiness) items are green.",
    icon: CheckCircle
  },
  pha_y3_nmr: {
    title: "Annual PHA (MRC 3)",
    month: 36,
    type: "Readiness",
    location: "Garrison",
    systems: ["MEDPROS", "e-Profile"],
    description: "Due to unresolved issues from the deployment (identified in PDHRA), the Service Member is coded MRC 3. A Medical Evaluation Board (MEB) or prolonged rehabilitation may be initiated. PULHES 'S' code may be updated to S-2 or S-3.",
    icon: AlertTriangle
  },
  pha_missed: {
    title: "Missed PHA Window",
    month: 40,
    type: "Admin",
    location: "Garrison",
    systems: ["MEDPROS"],
    description: "The 15-month window since the last health assessment has elapsed.",
    icon: Clock
  },
  mrc4_alert: {
    title: "MRC 4 Status Change",
    month: 40.1,
    type: "Admin",
    location: "Garrison",
    systems: ["MEDPROS", "MODS"],
    description: "AUTOMATED ALERT: Due to the gap >15 months in assessment data, the system automatically recategorizes the SM as MRC 4 (Indeterminate). They are administratively non-deployable until a new PHA is logged.",
    icon: AlertTriangle
  },
  separation: {
    title: "Separation / SHA",
    month: 48,
    type: "Milestone",
    location: "Garrison",
    systems: ["MHS GENESIS", "VA Systems"],
    description: "Separation Health Assessment. All records from ANAM, TMDS, ILER, and MHS GENESIS are consolidated for transition to Veteran Affairs (VA) care.",
    icon: Shield
  }
};

const TimelineNode = ({ event, isLast, onClick, isSelected }) => {
  // Safe Icon rendering
  const Icon = event.icon || Info;

  const getDotColor = (type) => {
    switch(type) {
      case 'Cognitive': return 'bg-purple-500 ring-purple-200';
      case 'Readiness': return 'bg-green-500 ring-green-200';
      case 'Screening': return 'bg-blue-500 ring-blue-200';
      case 'Exposure': return 'bg-red-500 ring-red-200';
      case 'Clinical': return 'bg-orange-500 ring-orange-200';
      case 'Admin': return 'bg-gray-500 ring-gray-200';
      default: return 'bg-indigo-500 ring-indigo-200';
    }
  };

  return (
    <div className="relative pl-8 sm:pl-32 py-6 group cursor-pointer" onClick={onClick}>
      {/* Time Label (Desktop) */}
      <div className="hidden sm:flex flex-col items-end absolute left-0 top-6 w-24 pr-8 text-right">
        <span className="text-sm font-bold text-gray-900">Month {Math.floor(event.month)}</span>
        <span className="text-xs text-gray-500">{event.location}</span>
      </div>

      {/* Vertical Line */}
      <div className="flex flex-col items-center absolute left-8 sm:left-32 top-0 h-full">
        {!isLast && <div className="w-0.5 bg-gray-200 h-full absolute top-8"></div>}
        <div className={`w-4 h-4 rounded-full ring-4 ${getDotColor(event.type)} ${isSelected ? 'scale-125' : 'group-hover:scale-110'} transition-transform z-10 relative`}>
          {event.type === 'Exposure' || event.type === 'Clinical' ? (
            <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping"></div>
          ) : null}
        </div>
      </div>

      {/* Content Card */}
      <div className={`ml-4 sm:ml-8 p-4 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-md' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.type === 'Cognitive' ? 'bg-purple-100 text-purple-700' :
                event.type === 'Exposure' ? 'bg-red-100 text-red-700' :
                event.type === 'Readiness' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {event.type}
              </span>
              <span className="sm:hidden text-xs text-gray-400">Month {event.month}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
          </div>
          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
        </div>
      </div>
    </div>
  );
};

const SystemBadge = ({ system }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
    <Database className="w-3 h-3" />
    {system}
  </span>
);

export default function CognitiveHealthTimeline() {
  const [activeScenarioId, setActiveScenarioId] = useState('standard');
  const [selectedEventId, setSelectedEventId] = useState('tapas'); // Default to TAPAS which is in all scenarios

  const scenario = SCENARIOS[activeScenarioId];

  // Robust mapping with error checking
  const eventList = scenario.events
    .map(id => {
      const data = EVENT_DATABASE[id];
      if (!data) return null;
      return { ...data, id };
    })
    .filter(item => item !== null);

  // Update selection when scenario changes to ensure we don't have a stale ID
  useEffect(() => {
    if (eventList.length > 0) {
      setSelectedEventId(eventList[0].id);
    }
  }, [activeScenarioId]);

  // Fallback if selectedEventId is not in the current list
const selectedEvent =
  eventList.find(e => e.id === selectedEventId) ||
  eventList[0] ||
  null;


  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">

      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cognitive Health Surveillance Pathway</h1>
              <p className="text-sm text-slate-400">From Enlistment to Separation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
            {Object.values(SCENARIOS).map(s => (
              <button
                key={s.id}
                onClick={() => setActiveScenarioId(s.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeScenarioId === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">

        {/* Left Panel: Timeline */}
        <div className="w-full md:w-5/12 lg:w-1/3 overflow-y-auto border-r border-gray-200 bg-white">
          <div className="p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 sticky top-0 bg-white z-10 py-2 border-b">
              Timeline: {scenario.name}
            </h2>
            <div className="relative">
              {eventList.map((event, index) => (
                <TimelineNode
                  key={event.id}
                  event={event}
                  isLast={index === eventList.length - 1}
                  isSelected={selectedEventId === event.id}
                  onClick={() => setSelectedEventId(event.id)}
                />
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
              <p className="font-semibold mb-1">Timeline Key:</p>
              <div className="grid grid-cols-2 gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Cognitive Test</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Readiness (PHA)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Screening (PDHA)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Exposure/Injury</span>
              </div>
              

            </div>
          </div>
        </div>

        {/* Right Panel: Detail View */}
        <div className="hidden md:flex flex-1 flex-col bg-slate-50/50 overflow-y-auto">
          {selectedEvent && (
            <div className="p-8 max-w-3xl mx-auto w-full">

              {/* Event Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className={`p-4 rounded-xl shadow-sm ${
                  selectedEvent.type === 'Exposure' ? 'bg-red-100 text-red-600' :
                  selectedEvent.type === 'Cognitive' ? 'bg-purple-100 text-purple-600' :
                  'bg-white text-blue-600'
                }`}>
                  {React.createElement(selectedEvent.icon || Info, { className: "w-8 h-8" })}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-sm font-mono text-slate-500 uppercase tracking-wide">
                       Month {selectedEvent.month} • {selectedEvent.location}
                     </span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedEvent.title}</h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              </div>

              {/* Data Flow Visualization */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Systems Architecture
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-slate-100 px-4 py-3 rounded-lg border border-slate-200 flex flex-col items-center min-w-[120px]">
                    <span className="text-xs text-slate-500 mb-1">Input Source</span>
                    <span className="font-semibold text-slate-800 text-center">
                      {selectedEvent.type === 'Exposure' ? 'Sensor/Unit' :
                       selectedEvent.type === 'Cognitive' ? 'ANAM Battery' : 'Provider/Form'}
                    </span>
                  </div>

                  <ChevronRight className="text-slate-300" />

                  <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-100 flex flex-col items-center min-w-[120px]">
                    <span className="text-xs text-blue-500 mb-1">System of Record</span>
                    <div className="flex flex-col items-center gap-1">
                      {selectedEvent.systems.map((sys, i) => (
                        <span key={i} className="font-bold text-blue-900 text-center text-sm">{sys}</span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight className="text-slate-300" />

                  <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-100 flex flex-col items-center min-w-[120px]">
                    <span className="text-xs text-green-600 mb-1">Surveillance</span>
                    <span className="font-semibold text-green-900 text-center">
                       {selectedEvent.type === 'Readiness' ? 'MEDPROS (MRC)' :
                        selectedEvent.type === 'Exposure' ? 'ILER' : 'DMSS / GENESIS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contextual Insights */}
              <div className="grid grid-cols-1 gap-6">

                {/* Readiness Impact */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800">Readiness Impact</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selectedEvent.type === 'Readiness' ?
                      "Directly determines 'Deployable' status (MRC 1-4). Administrative gaps trigger automatic MRC 4 (Indeterminate) status." :
                     selectedEvent.type === 'Exposure' ?
                      "While not immediately limiting, exposure data builds a cumulative risk profile. High-tier exposures in ILER may trigger future screening requirements." :
                     selectedEvent.id?.includes('pos') ?
                      "Critical Impact: A positive screen here has a high statistical correlation with future Non-Medically Ready (MRC 3) status." :
                      "Supports readiness by establishing baselines or verifying fitness. Data must be present in MODS/MEDPROS to clear pre-deployment checks."
                    }
                  </p>
                </div>

                {/* Clinical Context */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-800">Cognitive Surveillance Context</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selectedEvent.type === 'Cognitive' ?
                      "The ANAM4 TBI-MIL is the DoD standard. It measures throughput (speed/accuracy). Note: Mood and effort (sandbagging) can confound this baseline." :
                     selectedEvent.type === 'Exposure' ?
                      "Data from blast sensors and unit locations are aggregated in ILER. This moves surveillance from 'symptom-based' to 'dose-based' (psi)." :
                      "This event acts as a checkpoint in the surveillance pathway. It relies on the previous data (Baseline or Theater Encounter) to determine if a significant change has occurred."
                    }
                  </p>
                </div>
                  

                {/* Clinical Context */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-800">Pathway</h3>
                  </div>
                <div>
                <SankeyPathway scenario={scenario} events={eventList} />
                </div>
                </div>




              </div>
                               

            </div>




          )}

          {/* Empty State / Prompt */}
          {!selectedEvent && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Activity className="w-16 h-16 mb-4 opacity-20" />
              <p>Select an event from the timeline to view details.</p>
            </div>
          )}
        </div>



      </main>

      {/* Mobile Details Modal */}
      <div className="md:hidden">
        {selectedEvent && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl shadow-2xl border-t border-gray-200 z-50 max-h-[50vh] overflow-y-auto">
             <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                <button onClick={() => setSelectedEventId(null)} className="text-gray-400 p-2">✕</button>
             </div>
             <p className="text-sm text-gray-600 mb-4">{selectedEvent.description}</p>
             <div className="flex flex-wrap gap-2">
               {selectedEvent.systems.map(s => <SystemBadge key={s} system={s} />)}
             </div>
          </div>
        )}
      </div>

    </div>

    
  );
}