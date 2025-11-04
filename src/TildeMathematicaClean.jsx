import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title as ChartJSTitle, Tooltip as ChartJSTooltip, Legend as ChartJSLegend, Filler } from 'chart.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './styles/tilde-mathematica.css';
import LogoImage from  './assets/image_folder/Group-1.jpg';

// KaTeX Stylesheet Loader
const KaTeXStylesheetLoader = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.integrity = 'sha384-n8MVd4RsNIU0KOVEMVIqhKyMVP1aNVO3ZiGo72eZbMXeCI3Le97Fx9aGGzN2AFap';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);
  return null;
};

// KaTeX Component
const KaTeX = ({ children }) => {
    const ref = useRef();
    useEffect(() => {
        if (ref.current) {
            try {
                katex.render(children, ref.current, {
                    throwOnError: false,
                    displayMode: true,
                });
            } catch (e) {
                console.error("KaTeX rendering error:", e);
                ref.current.textContent = children;
            }
        }
    }, [children]);
    return <div ref={ref} />;
};

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, ChartJSTitle, ChartJSTooltip, ChartJSLegend, Filler);

// Constants
const EFFICIENCY_THRESHOLD = 2.0;

// Semiconductor Technology Data
const techNodes = {
  '3nm': {
    transistorsPerNand: 4,
    powerPerTransistor: 0.8,
    areaPerTransistor: 0.008,
    frequency: 3.5,
    voltage: 0.7
  },
  '5nm': {
    transistorsPerNand: 4,
    powerPerTransistor: 1.2,
    areaPerTransistor: 0.015,
    frequency: 3.2,
    voltage: 0.75
  },
  '7nm': {
    transistorsPerNand: 4,
    powerPerTransistor: 2.0,
    areaPerTransistor: 0.025,
    frequency: 3.0,
    voltage: 0.75
  },
  '14nm': {
    transistorsPerNand: 4,
    powerPerTransistor: 4.5,
    areaPerTransistor: 0.05,
    frequency: 2.8,
    voltage: 0.8
  },
  '22nm': { transistorsPerNand: 4, powerPerTransistor: 8.0, areaPerTransistor: 0.08, frequency: 2.5, voltage: 0.9 },
  '28nm': { transistorsPerNand: 4, powerPerTransistor: 12.0, areaPerTransistor: 0.12, frequency: 2.2, voltage: 1.0 }
};

// Conventional Format Gate Estimates
const conventionalGates = {
  FP4_Dedicated: {
    logicGates: 450,
    description: "4-bit FP ALU (Dedicated TPU/NPU)"
  },
  FP4_MultiFormat: {
    logicGates: 1200,
    description: "4-bit FP in Multi-Format ALU (GPU)"
  },
  BFloat16: {
    logicGates: 3200,
    description: "16-bit BF16 ALU"
  },
  FP32: {
    logicGates: 12000,
    description: "32-bit IEEE FP ALU"
  },
  FP64: { logicGates: 28000, description: "64-bit IEEE FP ALU" }
};

// Beta conversion functions
const betaToSlider = (beta) => {
  if (beta <= 1.02) return 0;
  if (beta >= 30.0) return 100;

  const logBeta = Math.log(beta - 1.0);
  const logMin = Math.log(0.02);
  const logMax = Math.log(29.0);

  return ((logBeta - logMin) / (logMax - logMin)) * 100;
};

const sliderToBeta = (sliderValue) => {
  const logMin = Math.log(0.02);
  const logMax = Math.log(29.0);

  const logBeta = logMin + (sliderValue / 100) * (logMax - logMin);
  return Math.max(1.02, Math.min(30.0, 1.0 + Math.exp(logBeta)));
};

// Utility Functions
const calculateLutLength = (beta) => {
  const baseLength = Math.max(1, Math.floor(8 / (beta - 1)));
  return beta >= EFFICIENCY_THRESHOLD ? 1 : baseLength;
};

const getLutValue = (d, beta) => {
  if (beta >= EFFICIENCY_THRESHOLD && d > 0) return 1;
  return Math.min(d, Math.floor(Math.log(d + 1) / Math.log(beta)));
};

// UI Components
const CleanCard = ({ children, className = "", variant = "default" }) => {
  const variantClasses = {
    default: "tilde-card",
    elevated: "tilde-card elevated",
    glass: "tilde-card glass"
  };
  
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

const TabButton = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`tilde-tab-button ${active ? 'active' : ''}`}
  >
    {children}
  </button>
);

const MetricCard = ({ title, value, unit, variant = "default", description }) => {
  return (
    <div className={`tilde-metric-card ${variant}`}>
      <h4 className="tilde-metric-title">{title}</h4>
      <div className="tilde-metric-value">{value}</div>
      <div className="tilde-metric-unit">{unit}</div>
      {description && <div className="tilde-metric-description">{description}</div>}
    </div>
  );
};

// Enhanced Beta Slider
const BetaSlider = ({ beta, setBeta, lutLength }) => {
  const sliderValue = betaToSlider(beta);

  const handleSliderChange = (e) => {
    const newSliderValue = parseFloat(e.target.value);
    const newBeta = sliderToBeta(newSliderValue);
    setBeta(newBeta);
  };

  return (
    <CleanCard className="tilde-p-6">
      <div className="tilde-space-y-6">
        <div className="tilde-flex tilde-justify-between tilde-items-center">
          <label className="tilde-font-semibold tilde-text-white tilde-text-lg">
            β VALUE
          </label>
          <span className="tilde-text-sm tilde-text-white tilde-bg-white-20 tilde-px-3 tilde-py-1 tilde-rounded-full">
            LUT Length: {lutLength}
          </span>
        </div>

        <div className="tilde-relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderValue}
            onChange={handleSliderChange}
            className="tilde-slider"
          />
        </div>

        <div className="tilde-flex tilde-justify-between tilde-text-xs tilde-text-white">
          <span>1.02 (Precision)</span>
          <span>30.0 (Efficiency)</span>
        </div>

        <div className="tilde-flex tilde-justify-center tilde-pt-4">
          <div className="tilde-rounded-full tilde-bg-gradient-to-r tilde-from-408BCA tilde-to-5E84A2 tilde-px-6 tilde-py-3 tilde-text-xl tilde-font-bold tilde-text-white tilde-shadow-lg">
            {beta.toFixed(4)}
          </div>
        </div>

        <div className="tilde-text-center">
          <span className={`tilde-rounded-full tilde-px-3 tilde-py-1 tilde-text-sm tilde-font-medium ${
            beta >= EFFICIENCY_THRESHOLD ? 'tilde-bg-408BCA tilde-text-white' : 'tilde-bg-1B4469-50 tilde-text-white'
          }`}>
            {beta >= EFFICIENCY_THRESHOLD ? 'Simplified Mode' : 'Full LUT Mode'}
          </span>
        </div>
      </div>
    </CleanCard>
  );
};

// Interactive Calculator Component
const InteractiveCalculator = ({
  bitWidth, setBitWidth, a, setA, b, setB, operation, setOperation,
  beta, setBeta, result, commonTerms, gateCount, lutLength, errorPercentage,
  maxValue
}) => {
  const presets = [
    { name: "AI/ML Inference", beta: 2.5, bitWidth: 4 }, 
    { name: "High Efficiency", beta: 4.0, bitWidth: 4 },
    { name: "IoT Sensors", beta: 1.5, bitWidth: 5 }, 
    { name: "MIDI Music", beta: 1.4, bitWidth: 6 },
    { name: "Ultra Precision", beta: 1.05, bitWidth: 8 }
  ];

  const applyPreset = (preset) => {
    setBeta(preset.beta);
    setBitWidth(preset.bitWidth);
  };

  return (
    <div className="tilde-space-y-6">
      {/* Bit Width Control */}
      <CleanCard className="tilde-p-8" variant="elevated">
        <div className="tilde-flex tilde-justify-between tilde-items-center tilde-mb-6">
          <label className="tilde-text-lg tilde-font-semibold tilde-text-white">Bit Width: {bitWidth} bits</label>
          <span className="tilde-text-sm tilde-text-white-70 tilde-bg-white-10 tilde-px-3 tilde-py-1 tilde-rounded-full">Range: 0 to {maxValue}</span>
        </div>
        <input
          type="range"
          min="2"
          max="12"
          value={bitWidth}
          onChange={(e) => setBitWidth(parseInt(e.target.value))}
          className="tilde-slider"
        />
      </CleanCard>

      {/* Input Values and Operation */}
      <CleanCard className="tilde-p-8" variant="glass">
        <div className="tilde-flex tilde-flex-col md:tilde-flex-row tilde-items-center tilde-justify-center tilde-gap-6">
          {/* Value A */}
          <div className="tilde-flex tilde-flex-col tilde-items-center">
            <label className="tilde-text-sm tilde-font-medium tilde-text-white-80 tilde-mb-3">A:</label>
            <input
              type="number"
              value={a}
              onChange={(e) => setA(parseInt(e.target.value || 0))}
              min="0"
              max={maxValue}
              className="tilde-input w-24"
            />
          </div>

          {/* Operation Selector */}
          <div className="tilde-flex tilde-flex-col tilde-items-center">
            <label className="tilde-mb-3 tilde-text-sm tilde-font-medium tilde-text-white-80">Operation:</label>
            <div className="tilde-flex tilde-gap-2">
              {[
                { value: 'add', label: '+', name: 'Addition' },
                { value: 'sub', label: '−', name: 'Subtraction' },
                { value: 'mul', label: '×', name: 'Multiplication' },
                { value: 'div', label: '÷', name: 'Division' }
              ].map((op) => (
                <button
                  key={op.value}
                  onClick={() => setOperation(op.value)}
                  className={`tilde-button ${
                    operation === op.value ? 'primary' : 'secondary'
                  }`}
                  title={op.name}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Value B */}
          <div className="tilde-flex tilde-flex-col tilde-items-center">
            <label className="tilde-mb-3 tilde-text-sm tilde-font-medium tilde-text-white-80">B:</label>
            <input
              type="number"
              value={b}
              onChange={(e) => setB(parseInt(e.target.value || 0))}
              min="0"
              max={maxValue}
              className="tilde-input w-24"
            />
          </div>
        </div>
      </CleanCard>

      {/* Beta Slider */}
      <BetaSlider beta={beta} setBeta={setBeta} lutLength={lutLength} />

      {/* Application Presets */}
      <CleanCard className="tilde-p-8" variant="elevated">
        <h3 className="tilde-mb-6 tilde-text-lg tilde-font-semibold tilde-text-white">Application Presets:</h3>
        <div className="tilde-flex tilde-flex-wrap tilde-gap-4">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="tilde-preset-button"
            >
              <div className="tilde-text-center">
                <div className="tilde-font-semibold">{preset.name}</div>
                <div className="tilde-text-xs tilde-text-white-80 tilde-mt-1">β={preset.beta}</div>
              </div>
            </button>
          ))}
        </div>
      </CleanCard>

      {/* Result Display */}
      <CleanCard className="tilde-p-8" variant="glass">
        <h2 className="tilde-mb-8 tilde-text-2xl tilde-font-bold tilde-text-white">Result</h2>

        {/* Parameter Values */}
        <div className="tilde-mb-8">
          <div className="tilde-flex tilde-flex-wrap tilde-justify-center tilde-gap-4">
            <div className="tilde-rounded-full tilde-bg-gradient-to-r tilde-from-white-15 tilde-to-white-8 tilde-border tilde-border-white-20 tilde-px-6 tilde-py-3 tilde-text-sm tilde-text-white tilde-backdrop-blur-sm">
              <span className="tilde-text-white-80">β =</span>
              <span className="tilde-ml-2 tilde-font-mono tilde-font-bold tilde-text-white">{beta.toFixed(4)}</span>
            </div>
            <div className="tilde-rounded-full tilde-bg-gradient-to-r tilde-from-white-15 tilde-to-white-8 tilde-border tilde-border-white-20 tilde-px-6 tilde-py-3 tilde-text-sm tilde-text-white tilde-backdrop-blur-sm">
              <span className="tilde-text-white-80">α<sub>add</sub> =</span>
              <span className="tilde-ml-2 tilde-font-mono tilde-font-bold tilde-text-white">{Math.ceil(-Math.log(0.5 * (beta - 1)) / Math.log(beta))}</span>
            </div>
            <div className="tilde-rounded-full tilde-bg-gradient-to-r tilde-from-white-15 tilde-to-white-8 tilde-border tilde-border-white-20 tilde-px-6 tilde-py-3 tilde-text-sm tilde-text-white tilde-backdrop-blur-sm">
              <span className="tilde-text-white-80">α<sub>carry</sub> =</span>
              <span className="tilde-ml-2 tilde-font-mono tilde-font-bold tilde-text-white">{Math.floor(-Math.log(0.5 * (beta - 1)) / Math.log(beta))}</span>
            </div>
            <div className="tilde-rounded-full tilde-bg-gradient-to-r tilde-from-white-15 tilde-to-white-8 tilde-border tilde-border-white-20 tilde-px-6 tilde-py-3 tilde-text-sm tilde-text-white tilde-backdrop-blur-sm">
              <span className="tilde-text-white-80">Δ% =</span>
              <span className="tilde-ml-2 tilde-font-mono tilde-font-bold tilde-text-white">{errorPercentage.toFixed(4)}%</span>
            </div>
          </div>
        </div>

        <hr className="tilde-border-white-10 tilde-my-6" />

        {/* Calculation Result */}
        <div className="tilde-rounded-2xl tilde-border tilde-border-white-20 tilde-bg-gradient-to-br tilde-from-white-15 tilde-to-white-8 tilde-p-8 tilde-shadow-lg tilde-backdrop-blur-sm">
          <h3 className="tilde-mb-6 tilde-text-xl tilde-font-semibold tilde-text-white">RESULT:</h3>
          <div className="tilde-text-center">
            <div className="tilde-mb-6 tilde-text-3xl tilde-font-mono">
              <span className="tilde-font-bold tilde-text-408BCA">{operation}</span>
              <span className="tilde-text-white-80">(</span>
              <span className="tilde-font-bold tilde-text-white">{a}</span>
              <span className="tilde-text-white-80">, </span>
              <span className="tilde-font-bold tilde-text-white">{b}</span>
              <span className="tilde-text-white-80">)</span>
              <span className="tilde-text-4xl tilde-font-bold tilde-text-DFA01E tilde-ml-4">{result}</span>
            </div>
          </div>
        </div>
      </CleanCard>

      {/* Hardware Metrics */}
      <CleanCard className="tilde-p-8" variant="elevated">
        <h2 className="tilde-mb-6 tilde-text-2xl tilde-font-bold tilde-text-white">Hardware Metrics</h2>
        <div className="tilde-grid tilde-grid-cols-2 md:tilde-grid-cols-4 tilde-gap-4">
          <MetricCard
            title="Total Gates"
            value={gateCount.total}
            unit="logic gates"
            variant="primary"
          />
          <MetricCard
            title="LUT Size"
            value={lutLength}
            unit="entries"
            variant="default"
          />
          <MetricCard
            title="Transistors"
            value={`~${Math.round(gateCount.total * 1.8 * 4)}`}
            unit="estimated"
            variant="secondary"
          />
          <MetricCard
            title="Error Rate"
            value={errorPercentage.toFixed(1)}
            unit="%"
            variant="default"
            description={beta > EFFICIENCY_THRESHOLD ? "Simplified mode" : "Full LUT mode"}
          />
        </div>
      </CleanCard>
    </div>
  );
};

// Main Component
export default function TildeMathematica() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [bitWidth, setBitWidth] = useState(4);
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const [operation, setOperation] = useState('add');
  const [beta, setBeta] = useState(2.5);

  const maxValue = (1 << bitWidth) - 1;
  const lutLength = calculateLutLength(beta);

  const commonTerms = useMemo(() => ({
    Za: a === 0,
    Zb: b === 0,
    Ua: a === 1,
    Ub: b === 1,
    E: a === b,
    d: Math.abs(a - b),
    m: Math.max(a, b)
  }), [a, b]);

  const result = useMemo(() => {
    const { Za, Zb, Ua, Ub, E, d, m } = commonTerms;
    let res = 0;

    switch (operation) {
      case 'add':
        if (Za || Zb) res = m;
        else if (d < 8) res = m + getLutValue(d, beta);
        else res = m;
        break;
      case 'sub':
        if (E) res = 0;
        else if (Za || Zb) res = m;
        else res = m - getLutValue(d, beta);
        break;
      case 'mul':
        if (Za || Zb) res = 0;
        else if (Ua || Ub) res = m;
        else res = a + b - 1;
        break;
      case 'div':
        if (Za) res = 0;
        else if (Zb) res = maxValue;
        else if (E) res = 1;
        else res = a - b + 1;
        break;
      default: res = 0;
    }

    return Math.min(Math.max(0, res), maxValue);
  }, [operation, commonTerms, beta, maxValue, a, b]);

  const gateCount = useMemo(() => {
    const sharedGates = Math.round(bitWidth * 6 + 32);
    const addGates = Math.round(bitWidth * 3 + 16);
    const subGates = Math.round(bitWidth * 4 + 20);
    const mulGates = Math.round(bitWidth * 2 + 12);
    const divGates = Math.round(bitWidth * 2 + 12);
    const decoderGates = 12;
    const muxGates = Math.round(bitWidth * 6);

    const baseGates = sharedGates + addGates + subGates + mulGates + divGates + decoderGates + muxGates;
    const lutGates = beta >= EFFICIENCY_THRESHOLD ? Math.round(lutLength * 4) : Math.round(lutLength * 12);
    const total = baseGates + lutGates;

    return {
      base: baseGates,
      lut: lutGates,
      total: total,
      shared: sharedGates,
      add: addGates,
      sub: subGates,
      mul: mulGates,
      div: divGates,
      control: decoderGates + muxGates
    };
  }, [bitWidth, lutLength, beta]);

  const errorPercentage = useMemo(() =>
    100 * (beta - 1) / (beta + 1), [beta]
  );

  const navigationTabs = [
    { id: 'calculator', label: 'Interactive Calculator' },
    { id: 'beta', label: 'β Analysis & Charts' },
    { id: 'hardware', label: 'Hardware Competitive Analysis' },
    { id: 'visualizations', label: 'Visualizations' },
    { id: 'reference', label: 'Reference' }
  ];

  return (
    <div className="tilde-container">
      <KaTeXStylesheetLoader />
      <div className="tilde-bg-effects">
        <div className="tilde-bg-effect-1"></div>
        <div className="tilde-bg-effect-2"></div>
      </div>

      <div className="tilde-content">
        <header className="tilde-header">
          <div className="tilde-header-grid">
            <div>
              {/* Logo Section */}
              <img 
                src={LogoImage}
                alt="Tilde Platform Logo"
                className="tilde-logo"
                loading="eager"
                width={200}
                height={60}
              />
              <br />
              
              <span className="tilde-platform-badge">
                Tilde Platform
              </span>
              <p className="tilde-description">
                Universal numerical computing platform for efficient computation across AI/ML, IoT, and precision domains.
                Explore a cohesive toolkit for analysing β-driven arithmetic, validating hardware savings, and generating reference material.
              </p>

              <div className="tilde-features">
                <span className="tilde-feature-tag">
                  Adaptive numeric primitives
                </span>
                <span className="tilde-feature-tag">
                  Hardware-aware insights
                </span>
                <span className="tilde-feature-tag">
                  Interactive experimentation
                </span>
              </div>
            </div>

            <div className="tilde-snapshot">
              <h2 className="tilde-snapshot-title">
                Live Snapshot
              </h2>
              <div className="tilde-snapshot-grid">
                <div className="tilde-snapshot-item">
                  <p className="tilde-snapshot-label">β value</p>
                  <p className="tilde-snapshot-value">{beta.toFixed(4)}</p>
                  <p className="tilde-snapshot-description">
                    {beta >= EFFICIENCY_THRESHOLD ? 'Simplified mode' : 'Full LUT mode'}
                  </p>
                </div>
                <div className="tilde-snapshot-item">
                  <p className="tilde-snapshot-label">Bit width</p>
                  <p className="tilde-snapshot-value">{bitWidth} bits</p>
                  <p className="tilde-snapshot-description">Range 0 – {maxValue}</p>
                </div>
                <div className="tilde-snapshot-item">
                  <p className="tilde-snapshot-label">Gate count</p>
                  <p className="tilde-snapshot-value">{gateCount.total}</p>
                  <p className="tilde-snapshot-description">Total logic gates</p>
                </div>
                <div className="tilde-snapshot-item">
                  <p className="tilde-snapshot-label">Error Δ%</p>
                  <p className="tilde-snapshot-value">{errorPercentage.toFixed(1)}%</p>
                  <p className="tilde-snapshot-description">Relative accuracy envelope</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="tilde-tab-nav">
          <nav className="tilde-tab-container">
            {navigationTabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </nav>
        </div>

      <div className="tilde-content-area">
        {/* Tab Content */}
        {activeTab === 'calculator' && (
          <div className="tilde-space-y-12 px-4">
            <div className="tilde-mb-12">
              <InteractiveCalculator
              bitWidth={bitWidth}
              setBitWidth={setBitWidth}
              a={a}
              setA={setA}
              b={b}
              setB={setB}
              operation={operation}
              setOperation={setOperation}
              beta={beta}
              setBeta={setBeta}
              result={result}
              commonTerms={commonTerms}
              gateCount={gateCount}
              lutLength={lutLength}
              errorPercentage={errorPercentage}
              maxValue={maxValue}
            />
            </div>
          </div>
          )}

          {activeTab === 'beta' && (
            <div className="tilde-text-center">
              <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white">β Analysis & Charts</h2>
              <p className="tilde-text-white">Coming soon...</p>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="tilde-text-center">
              <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white">Hardware Analysis</h2>
              <p className="tilde-text-white">Coming soon...</p>
            </div>
          )}

          {activeTab === 'visualizations' && (
            <div className="tilde-text-center">
              <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white">Visualizations</h2>
              <p className="tilde-text-white">Coming soon...</p>
            </div>
          )}

          {activeTab === 'reference' && (
            <div className="tilde-text-center">
              <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white">Reference</h2>
              <p className="tilde-text-white">Coming soon...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="tilde-footer">
          <div className="tilde-footer-content">
            <span>Tilde Arithmetic Research & Development</span>
            <span>•</span>
            <span>Efficient Universal Computing</span>
            <span>•</span>
            <span>© 2025</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
