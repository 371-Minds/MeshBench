import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Eye, 
  Lightbulb, 
  Users, 
  Zap, 
  Play, 
  Save, 
  Download,
  Settings,
  PlusCircle,
  AlertCircle,
  MessageSquare,
  Link as LinkIcon,
  CheckCircle2,
  FileJson,
  Activity
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

type CognitiveDomain = 'Learning' | 'Metacognition' | 'Attention' | 'Executive Function' | 'Social Cognition' | 'Cognitive Load';

interface BenchmarkTask {
  id: string;
  domain: CognitiveDomain;
  title: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  evaluationCriteria: string;
  kaggleLink?: string;
  isCustom?: boolean;
}

const DOMAINS: { name: CognitiveDomain; icon: React.ElementType; desc: string; isCustom?: boolean }[] = [
  { name: 'Learning', icon: Lightbulb, desc: 'Acquiring new, novel concepts in-context.' },
  { name: 'Metacognition', icon: Brain, desc: 'Self-awareness of knowledge limits and confidence.' },
  { name: 'Attention', icon: Eye, desc: 'Focusing on relevant data amidst noise.' },
  { name: 'Executive Function', icon: Zap, desc: 'Adapting to changing rules and planning.' },
  { name: 'Social Cognition', icon: Users, desc: 'Theory of Mind and asymmetric information.' },
  { name: 'Cognitive Load', icon: Activity, desc: 'Measuring hallucination rates under high intrinsic load.', isCustom: true },
];

const TEMPLATES: Record<CognitiveDomain, BenchmarkTask> = {
  'Social Cognition': {
    id: 'sc-01',
    domain: 'Social Cognition',
    title: 'False Belief Test (Procedural)',
    systemPrompt: 'You are an agent observing a scenario. You must answer questions about the mental states of the characters involved.',
    userPromptTemplate: 'Scenario: [Character A] places the [Object] in the [Location 1]. [Character A] leaves the room. [Character B] enters and moves the [Object] to [Location 2]. [Character A] returns.\n\nQuestion: Where will [Character A] look for the [Object]? Explain your reasoning.',
    variables: ['Character A', 'Character B', 'Object', 'Location 1', 'Location 2'],
    evaluationCriteria: 'Did the model correctly identify that [Character A] has a false belief?',
    kaggleLink: 'https://share.google/tH2F0A4CWlEWApFw6'
  },
  'Executive Function': {
    id: 'ef-01',
    domain: 'Executive Function',
    title: 'Silent Rule-Reversal Task',
    systemPrompt: 'You are an AI assistant tasked with sorting items according to strict rules. You must follow the most recent rule provided.',
    userPromptTemplate: 'Initial Rule: Sort the following items by [Primary Attribute].\nItems: [Item List]\n\nUpdate from management: Ignore the previous rule. Items must now be sorted by [Secondary Attribute].\n\nTask: Provide the sorted list.',
    variables: ['Primary Attribute', 'Item List', 'Secondary Attribute'],
    evaluationCriteria: 'Did the model successfully inhibit the initial rule and apply the secondary rule?',
    kaggleLink: 'https://share.google/tKeBOMHiYVbACAgwj'
  },
  'Metacognition': {
    id: 'mc-01',
    domain: 'Metacognition',
    title: 'Confidence Calibration (Impossible Task)',
    systemPrompt: 'You are a logical reasoning AI. For every answer, you must provide a confidence score between 0% and 100%.',
    userPromptTemplate: 'Scenario: [Paradoxical Scenario]\n\nQuestion: [Unanswerable Question]\n\nProvide your answer and your confidence score.',
    variables: ['Paradoxical Scenario', 'Unanswerable Question'],
    evaluationCriteria: 'Did the model provide a low confidence score (<20%) or acknowledge the impossibility?',
    kaggleLink: 'https://share.google/Yi2Vp60OBr1XuShYP'
  },
  'Learning': {
    id: 'lr-01',
    domain: 'Learning',
    title: 'Novel Concept Synthesis',
    systemPrompt: 'You are a scientific AI operating in a universe with alternate physical laws.',
    userPromptTemplate: 'Definition: A "[Material A]" is a substance that repels "[Material B]" but attracts "[Material C]".\n\nPuzzle: If I place a block of [Material A] between a block of [Material B] and a block of [Material C], what will happen?\n\nExplain step-by-step.',
    variables: ['Material A', 'Material B', 'Material C'],
    evaluationCriteria: 'Did the model correctly apply the novel rules without hallucinating real-world physics?',
    kaggleLink: 'https://share.google/Jxh8xeFtMAwPpSYVA'
  },
  'Attention': {
    id: 'at-01',
    domain: 'Attention',
    title: 'Distractor Inhibition (Needle in Haystack)',
    systemPrompt: 'You are an AI data extractor. You must find specific information hidden within a large block of irrelevant text.',
    userPromptTemplate: 'Context: [Irrelevant Text 1] [Hidden Target Fact] [Irrelevant Text 2]\n\nQuestion: What is the [Target Subject]?',
    variables: ['Irrelevant Text 1', 'Hidden Target Fact', 'Irrelevant Text 2', 'Target Subject'],
    evaluationCriteria: 'Did the model successfully locate the target fact despite the noise?',
    kaggleLink: 'https://share.google/PiuV5XggwTh0WDnSV'
  },
  'Cognitive Load': {
    id: 'cl-01',
    domain: 'Cognitive Load',
    title: 'Intrinsic Load Stress Test',
    systemPrompt: 'You are an AI assistant. You must answer the user\'s question while strictly adhering to the following constraints: 1. Do not use the letter "e". 2. Answer in exactly 3 sentences. 3. The final word must be "blue".',
    userPromptTemplate: 'Question: Explain the process of [Complex Process].\n\nRemember the constraints: No letter "e", exactly 3 sentences, end with "blue".',
    variables: ['Complex Process'],
    evaluationCriteria: 'Did the model hallucinate facts or break constraints under high cognitive load?',
    isCustom: true
  }
};

// Mock data generator for testing
const generateMockData = (variables: string[]) => {
  const mockData: Record<string, string> = {};
  variables.forEach(v => {
    if (v.includes('Character A')) mockData[v] = 'Alice';
    else if (v.includes('Character B')) mockData[v] = 'Bob';
    else if (v.includes('Object')) mockData[v] = 'keys';
    else if (v.includes('Location 1')) mockData[v] = 'drawer';
    else if (v.includes('Location 2')) mockData[v] = 'pocket';
    else if (v.includes('Primary Attribute')) mockData[v] = 'color';
    else if (v.includes('Secondary Attribute')) mockData[v] = 'weight';
    else if (v.includes('Item List')) mockData[v] = 'Red Widget (10g), Blue Widget (5g), Green Widget (20g)';
    else if (v.includes('Paradoxical Scenario')) mockData[v] = 'A barber shaves all those, and those only, who do not shave themselves.';
    else if (v.includes('Unanswerable Question')) mockData[v] = 'Does the barber shave himself?';
    else if (v.includes('Material A')) mockData[v] = 'Gloop';
    else if (v.includes('Material B')) mockData[v] = 'Blarp';
    else if (v.includes('Material C')) mockData[v] = 'Snarf';
    else if (v.includes('Irrelevant Text 1')) mockData[v] = 'The history of agriculture dates back thousands of years. Early farmers cultivated wheat and barley.';
    else if (v.includes('Hidden Target Fact')) mockData[v] = 'The secret launch code is 84729.';
    else if (v.includes('Irrelevant Text 2')) mockData[v] = 'Modern farming techniques involve crop rotation and synthetic fertilizers.';
    else if (v.includes('Target Subject')) mockData[v] = 'secret launch code';
    else if (v.includes('Complex Process')) mockData[v] = 'photosynthesis';
    else mockData[v] = `Sample ${v}`;
  });
  return mockData;
};

export default function App() {
  const [activeDomain, setActiveDomain] = useState<CognitiveDomain>('Cognitive Load');
  
  // Form State
  const [taskTitle, setTaskTitle] = useState(TEMPLATES['Cognitive Load'].title);
  const [systemPrompt, setSystemPrompt] = useState(TEMPLATES['Cognitive Load'].systemPrompt);
  const [userPrompt, setUserPrompt] = useState(TEMPLATES['Cognitive Load'].userPromptTemplate);
  const [evalCriteria, setEvalCriteria] = useState(TEMPLATES['Cognitive Load'].evaluationCriteria);
  
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Update form when domain changes
  useEffect(() => {
    const template = TEMPLATES[activeDomain];
    setTaskTitle(template.title);
    setSystemPrompt(template.systemPrompt);
    setUserPrompt(template.userPromptTemplate);
    setEvalCriteria(template.evaluationCriteria);
    setTestResult(null);
  }, [activeDomain]);

  const detectedVariables = Array.from(new Set(userPrompt.match(/\[(.*?)\]/g) || [])).map(v => v.replace(/[\[\]]/g, ''));

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const mockData = generateMockData(detectedVariables);
      let testPrompt = userPrompt;
      
      detectedVariables.forEach(variable => {
        const regex = new RegExp(`\\[${variable}\\]`, 'g');
        testPrompt = testPrompt.replace(regex, mockData[variable] || `[${variable}]`);
      });

      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${testPrompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: fullPrompt,
      });
      
      setTestResult(response.text || 'No response generated.');
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
    setTimeout(() => setShowExportModal(false), 3000);
  };

  return (
    <div className="flex h-screen bg-[#f5f5f4] font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0a0a0a] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-400" />
            MetaBench
          </h1>
          <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">Deployment Engine</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Cognitive Domains
          </div>
          <nav className="space-y-1 px-2">
            {DOMAINS.map((domain) => {
              const Icon = domain.icon;
              const isActive = activeDomain === domain.name;
              return (
                <button
                  key={domain.name}
                  onClick={() => setActiveDomain(domain.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? 'bg-white/10 text-white font-medium' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? (domain.isCustom ? 'text-purple-400' : 'text-emerald-400') : ''}`} />
                    {domain.name}
                  </div>
                  {domain.isCustom && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Custom</span>
                  )}
                </button>
              );
            })}
          </nav>

          {TEMPLATES[activeDomain].kaggleLink && (
            <>
              <div className="px-4 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Kaggle Integration
              </div>
              <div className="px-4 space-y-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-1">
                    <LinkIcon className="w-4 h-4 text-blue-400" />
                    Linked Resource
                  </div>
                  <a 
                    href={TEMPLATES[activeDomain].kaggleLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 truncate block transition-colors"
                    title={TEMPLATES[activeDomain].kaggleLink}
                  >
                    {TEMPLATES[activeDomain].kaggleLink}
                  </a>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Official Kaggle requirement doc for {activeDomain}.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <Settings className="w-4 h-4" />
            Platform Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-gray-900">{activeDomain} Benchmark</h2>
              {TEMPLATES[activeDomain].isCustom && (
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Unique Submission</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{DOMAINS.find(d => d.name === activeDomain)?.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#20BEFF] rounded-lg hover:bg-[#1CA8E5] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export to Kaggle JSONL
            </button>
          </div>
        </header>

        {/* Export Toast */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Benchmark compiled and exported successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Builder Pane */}
          <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200 bg-white">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {activeDomain === 'Cognitive Load' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
                  <h3 className="text-purple-900 font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Why this sets your submission apart
                  </h3>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    Most benchmarks test what a model knows. <strong>Cognitive Load Theory</strong> tests how a model <em>fails</em>. By artificially increasing the "intrinsic load" (e.g., forcing strict formatting constraints, forbidding certain letters, or requiring specific syntactic structures), you exhaust the model's attention mechanism. 
                    <br/><br/>
                    When cognitive load is maxed out, models are far more likely to hallucinate facts because their compute is tied up in constraint satisfaction. This is a highly novel approach to measuring AGI robustness that goes beyond standard recall tests.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${TEMPLATES[activeDomain].isCustom ? 'focus:ring-purple-500/20 focus:border-purple-500' : 'focus:ring-[#20BEFF]/20 focus:border-[#20BEFF]'}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                  <span className="text-xs text-gray-500">Defines the AI's persona/rules</span>
                </div>
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm font-mono resize-none ${TEMPLATES[activeDomain].isCustom ? 'focus:ring-purple-500/20 focus:border-purple-500' : 'focus:ring-[#20BEFF]/20 focus:border-[#20BEFF]'}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Procedural User Prompt Template</label>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${TEMPLATES[activeDomain].isCustom ? 'text-purple-600 bg-purple-50' : 'text-[#20BEFF] bg-[#20BEFF]/10'}`}>Use [Brackets] for variables</span>
                </div>
                <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm font-mono resize-none ${TEMPLATES[activeDomain].isCustom ? 'focus:ring-purple-500/20 focus:border-purple-500' : 'focus:ring-[#20BEFF]/20 focus:border-[#20BEFF]'}`}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-3">
                  <FileJson className="w-4 h-4" />
                  Procedural Variables Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {detectedVariables.length > 0 ? (
                    detectedVariables.map((variable, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-blue-200 text-blue-800 text-xs font-medium rounded-full shadow-sm">
                        {variable}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-blue-600/70 italic">No variables detected. Add [Variable] to create procedurally generated datasets.</span>
                  )}
                </div>
                <button className="mt-4 text-sm text-blue-700 font-medium flex items-center gap-1 hover:text-blue-800">
                  <PlusCircle className="w-4 h-4" /> Connect CSV Dataset
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Criteria</label>
                <input 
                  type="text" 
                  value={evalCriteria}
                  onChange={(e) => setEvalCriteria(e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${TEMPLATES[activeDomain].isCustom ? 'focus:ring-purple-500/20 focus:border-purple-500' : 'focus:ring-[#20BEFF]/20 focus:border-[#20BEFF]'}`}
                  placeholder="e.g., Did the model correctly identify the false belief?"
                />
              </div>

            </div>
          </div>

          {/* Preview & Test Pane */}
          <div className="w-[400px] bg-gray-50 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Play className={`w-4 h-4 ${TEMPLATES[activeDomain].isCustom ? 'text-purple-600' : 'text-emerald-600'}`} />
                Live Test (Gemini 3.1 Pro)
              </h3>
              <button 
                onClick={handleTest}
                disabled={isTesting}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isTesting ? 'Running...' : 'Run Test'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Simulated Input */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Compiled Prompt (Sample Data)</span>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap shadow-sm">
                  {(() => {
                    let previewPrompt = userPrompt;
                    const mockData = generateMockData(detectedVariables);
                    detectedVariables.forEach(variable => {
                      const regex = new RegExp(`\\[${variable}\\]`, 'g');
                      previewPrompt = previewPrompt.replace(regex, mockData[variable] || `[${variable}]`);
                    });
                    return previewPrompt;
                  })()}
                </div>
              </div>

              {/* Output */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Model Output</span>
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap shadow-inner min-h-[200px]">
                  {isTesting ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                      Evaluating cognitive response...
                    </div>
                  ) : testResult ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {testResult}
                    </motion.div>
                  ) : (
                    <div className="text-gray-600 italic flex flex-col items-center justify-center h-full gap-2 text-center">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                      Click "Run Test" to evaluate the model's reasoning.
                    </div>
                  )}
                </div>
              </div>
              
              {testResult && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">Evaluation Checklist</h4>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className={`mt-1 rounded focus:ring-2 ${TEMPLATES[activeDomain].isCustom ? 'text-purple-600 focus:ring-purple-500' : 'text-emerald-600 focus:ring-emerald-500'}`} />
                      <span className="text-sm text-gray-700">{evalCriteria}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
