import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line as RechartsLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title as ChartJSTitle, Tooltip as ChartJSTooltip, Legend as ChartJSLegend, Filler } from 'chart.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './styles/tilde-mathematica.css';
import LogoImage from './assets/image_folder/Group-1.jpg';

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
          <span className={`tilde-rounded-full tilde-px-3 tilde-py-1 tilde-text-sm tilde-font-medium ${beta >= EFFICIENCY_THRESHOLD ? 'tilde-bg-408BCA tilde-text-white' : 'tilde-bg-1B4469-50 tilde-text-white'
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
                  className={`tilde-button ${operation === op.value ? 'primary' : 'secondary'
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

// Beta Analysis with Charts - Clean color scheme
const BetaAnalysisTab = ({ beta, lutLength, errorPercentage }) => {
  // Generate data for beta sequence chart
  const betaSequenceData = useMemo(() => {
    const indices = Array.from({ length: 11 }, (_, i) => i);
    return indices.map(n => ({
      n,
      'β = 1.3': Math.pow(1.3, n),
      'β = 1.5': Math.pow(1.5, n),
      'β = 1.7': Math.pow(1.7, n),
      'β = 2.0': Math.pow(2.0, n)
    }));
  }, []);

  // Generate LUT data
  const lutData = useMemo(() => {
    const indices = Array.from({ length: 11 }, (_, i) => i);
    return indices.map(d => ({
      d,
      'Add LUT': Math.floor(Math.pow(1.5, d + 1) - Math.pow(1.5, d)),
      'Sub LUT': d > 0 ? Math.ceil(Math.pow(1.5, d) - Math.pow(1.5, d - 1)) : 0
    }));
  }, []);

  // Error percentage vs beta
  const errorData = useMemo(() => {
    const betaValues = Array.from({ length: 19 }, (_, i) => 1.2 + i * 0.2);
    return betaValues.map(b => ({
      beta: b.toFixed(1),
      error: 100 * (b - 1) / (b + 1)
    }));
  }, []);

  return (
    <div className="tilde-space-y-6">
      <div className="tilde-text-center tilde-mb-8">
        <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white tilde-mb-2">Tilde Base (β) Analysis</h2>
        <p className="tilde-text-white-80">Understanding the impact of β on Tilde arithmetic performance</p>
      </div>

      {/* Golden Ratio Explanation */}
      <CleanCard className="tilde-p-8" variant="glass">
        <h3 className="tilde-text-xl tilde-font-semibold tilde-text-white tilde-mb-4">Tilde Base Threshold (β = 2.0)</h3>
        <p className="tilde-text-white-80 tilde-mb-6">
          When β exceeds 2.0, Tilde arithmetic implementation becomes dramatically simpler. This threshold represents
          a fundamental shift in computational complexity and hardware requirements.
        </p>

        <div className="tilde-grid tilde-grid-cols-1 md:tilde-grid-cols-2 tilde-gap-6">
          <div className="tilde-bg-white-10 tilde-p-6 tilde-rounded-lg tilde-border tilde-border-white-20">
            <h4 className="tilde-font-semibold tilde-text-white tilde-mb-3 tilde-flex tilde-items-center">
              <span className="tilde-w-3 tilde-h-3 tilde-bg-408BCA tilde-rounded-full tilde-mr-2"></span>
              β &lt; 2.0 (Below Threshold)
            </h4>
            <ul className="tilde-text-sm tilde-text-white-80 tilde-space-y-2">
              <li>• Full LUT implementation required</li>
              <li>• Multiple carry conditions</li>
              <li>• Higher computational accuracy</li>
              <li>• More complex hardware design</li>
              <li>• Better for precision applications</li>
            </ul>
          </div>

          <div className="tilde-bg-white-10 tilde-p-6 tilde-rounded-lg tilde-border tilde-border-white-20">
            <h4 className="tilde-font-semibold tilde-text-white tilde-mb-3 tilde-flex tilde-items-center">
              <span className="tilde-w-3 tilde-h-3 tilde-bg-DFA01E tilde-rounded-full tilde-mr-2"></span>
              β &gt; 2.0 (Above Threshold)
            </h4>
            <ul className="tilde-text-sm tilde-text-white-80 tilde-space-y-2">
              <li>• Minimal LUTs needed</li>
              <li>• Single carry condition (a == b)</li>
              <li>• Extended dynamic range</li>
              <li>• Dramatically simpler hardware</li>
              <li>• Ideal for AI/ML applications</li>
            </ul>
          </div>
        </div>
      </CleanCard>

      {/* Charts */}
      <div className="tilde-grid tilde-grid-cols-1 lg:tilde-grid-cols-2 tilde-gap-6">
        <CleanCard className="tilde-p-6" variant="elevated">
          <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">β-Sequence Growth (βⁿ vs. n)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={betaSequenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="n" stroke="rgba(255,255,255,0.5)" />
              <YAxis scale="log" domain={['auto', 'auto']} stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: '#1B4469', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <RechartsLine type="monotone" dataKey="β = 1.3" stroke="#8884d8" strokeWidth={2} dot={false} />
              <RechartsLine type="monotone" dataKey="β = 1.5" stroke="#82ca9d" strokeWidth={2} dot={false} />
              <RechartsLine type="monotone" dataKey="β = 1.7" stroke="#ffc658" strokeWidth={2} dot={false} />
              <RechartsLine type="monotone" dataKey="β = 2.0" stroke="#ff7300" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CleanCard>

        <CleanCard className="tilde-p-6" variant="elevated">
          <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Lookup Table Values</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lutData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="d" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: '#1B4469', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="Add LUT" fill="#408BCA" />
              <Bar dataKey="Sub LUT" fill="#DFA01E" />
            </BarChart>
          </ResponsiveContainer>
        </CleanCard>
      </div>

      <CleanCard className="tilde-p-6" variant="elevated">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Error Percentage vs. β</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={errorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="beta" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip contentStyle={{ backgroundColor: '#1B4469', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
            <RechartsLine type="monotone" dataKey="error" stroke="#E04E1B" strokeWidth={3} dot={{ r: 4, fill: "#E04E1B" }} />
          </LineChart>
        </ResponsiveContainer>
      </CleanCard>

      {/* Application Domains Table */}
      <CleanCard className="tilde-p-8" variant="glass">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Application Domains</h3>
        <div className="tilde-overflow-x-auto">
          <table className="tilde-w-full tilde-text-left tilde-border-collapse">
            <thead>
              <tr className="tilde-border-b tilde-border-white-20">
                <th className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-font-medium tilde-text-white">Domain</th>
                <th className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-font-medium tilde-text-white">Tilde Base (β)</th>
                <th className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-font-medium tilde-text-white">Bit Width (w)</th>
                <th className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-font-medium tilde-text-white">Max Index (λ)</th>
                <th className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-font-medium tilde-text-white">Max Value</th>
                <th className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-font-medium tilde-text-white">Primary Benefit</th>
              </tr>
            </thead>
            <tbody className="tilde-divide-y tilde-divide-white-10">
              <tr>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">AI/ML Inference</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">2.5</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">4</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">15</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">{Math.pow(2.5, 15).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">Ultra hardware efficiency</td>
              </tr>
              <tr>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">High Efficiency Computing</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">4.0</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">4</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">15</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">{Math.pow(4.0, 15).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">Maximum performance density</td>
              </tr>
              <tr>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">IoT Sensors</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">1.5</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">31</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">{Math.pow(1.5, 31).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">Power efficiency with accuracy</td>
              </tr>
              <tr>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">MIDI Music</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">1.4</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">63</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">{Math.pow(1.4, 63).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">Musical accuracy</td>
              </tr>
              <tr>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">Ultra Precision</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">1.05</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">255</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80 tilde-font-mono">{Math.pow(1.05, 255).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="tilde-px-4 tilde-py-3 tilde-text-sm tilde-text-white-80">Scientific computing precision</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CleanCard>
    </div>
  );
};

// Hardware Analysis Tab with clean styling
const HardwareTab = ({ beta, bitWidth, lutLength, gateCount }) => {
  const [selectedTech, setSelectedTech] = useState('7nm');

  const techData = techNodes[selectedTech];

  const tildeMetrics = useMemo(() => {
    const computeBlocks = 1000;
    const nandGates = Math.round(gateCount.total * 1.8);
    const transistors = nandGates * techData.transistorsPerNand;
    const area = transistors * techData.areaPerTransistor;

    const powerPerBlock = transistors * techData.powerPerTransistor * techData.frequency / 1000;
    const totalPower = powerPerBlock * computeBlocks;
    const performance = techData.frequency * computeBlocks;

    return {
      logicGates: gateCount.total,
      nandGates,
      transistors,
      area,
      power: totalPower,
      performance,
      computingDensity: performance / (area * computeBlocks),
      energyEfficiency: performance / (totalPower / 1000),
      computeBlocks
    };
  }, [gateCount, techData]);

  const conventionalMetrics = useMemo(() => {
    const computeBlocks = 1000;

    return Object.entries(conventionalGates).map(([format, data]) => {
      const nandGates = Math.round(data.logicGates * 1.8);
      const transistors = nandGates * techData.transistorsPerNand;
      const area = transistors * techData.areaPerTransistor;

      const powerPerBlock = transistors * techData.powerPerTransistor * techData.frequency / 1000;
      const totalPower = powerPerBlock * computeBlocks;
      const performance = techData.frequency * computeBlocks;

      return {
        format,
        description: data.description,
        logicGates: data.logicGates,
        nandGates,
        transistors,
        area,
        power: totalPower,
        performance,
        computingDensity: performance / (area * computeBlocks),
        energyEfficiency: performance / (totalPower / 1000),
        computeBlocks
      };
    });
  }, [techData]);

  return (
    <div className="tilde-space-y-6">
      <div className="tilde-text-center tilde-mb-8">
        <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white tilde-mb-2">Hardware Analysis</h2>
        <p className="tilde-text-white-80">Complete Tilde Arithmetic Unit competitive analysis</p>
      </div>

      {/* Methodology Note */}
      <CleanCard className="tilde-p-6" variant="glass">
        <h3 className="tilde-text-sm tilde-font-semibold tilde-text-white tilde-mb-2">Gate Count Methodology</h3>
        <p className="tilde-text-xs tilde-text-white-80 tilde-mb-2">
          Floating-point ALUs require complex operations: alignment, mantissa operations, exponent handling,
          normalization, and rounding. Division is especially complex (6-15× more gates than addition).
        </p>
        <p className="tilde-text-xs tilde-text-white-80">
          <strong>FP4 Implementations:</strong> We show both dedicated FP4 chips (TPU/NPU style) and FP4 within
          multi-format ALUs (GPU style). Multi-format ALUs have ~2.7× overhead due to format multiplexing,
          shared units, and conversion logic needed to support multiple precisions.
        </p>
      </CleanCard>

      {/* Technology Selection */}
      <CleanCard className="tilde-p-6" variant="elevated">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Semiconductor Technology</h3>
        <div className="tilde-grid tilde-grid-cols-1 md:tilde-grid-cols-2 tilde-gap-6">
          <div>
            <label className="tilde-block tilde-text-sm tilde-font-medium tilde-text-white tilde-mb-2">Process Node:</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="tilde-input tilde-w-full"
            >
              {Object.keys(techNodes).map(node => (
                <option key={node} value={node}>{node} process</option>
              ))}
            </select>
          </div>
          <div className="tilde-text-sm tilde-text-white-80 tilde-space-y-2">
            <div className="tilde-flex tilde-justify-between">
              <span>Frequency:</span>
              <span className="tilde-font-mono">{techData.frequency} GHz</span>
            </div>
            <div className="tilde-flex tilde-justify-between">
              <span>Supply Voltage:</span>
              <span className="tilde-font-mono">{techData.voltage} V</span>
            </div>
            <div className="tilde-flex tilde-justify-between">
              <span>Power/Transistor:</span>
              <span className="tilde-font-mono">{techData.powerPerTransistor} fJ/op</span>
            </div>
            <div className="tilde-flex tilde-justify-between">
              <span>Area/Transistor:</span>
              <span className="tilde-font-mono">{techData.areaPerTransistor} µm²</span>
            </div>
          </div>
        </div>
      </CleanCard>

      {/* Tilde Performance Metrics */}
      <CleanCard className="tilde-p-6" variant="elevated">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">
          Tilde ALU Performance ({selectedTech}) - 1000 Compute Blocks
        </h3>
        <div className="tilde-grid tilde-grid-cols-2 md:tilde-grid-cols-4 tilde-gap-4">
          <MetricCard
            title="Computing Density"
            value={tildeMetrics.computingDensity.toFixed(1)}
            unit="GOPS/µm²"
            variant="primary"
          />
          <MetricCard
            title="Energy Efficiency"
            value={tildeMetrics.energyEfficiency.toFixed(1)}
            unit="GOPS/W"
            variant="primary"
          />
          <MetricCard
            title="Total Performance"
            value={tildeMetrics.performance.toFixed(0)}
            unit="GOPS"
            variant="secondary"
          />
          <MetricCard
            title="Total Power"
            value={(tildeMetrics.power / 1000).toFixed(1)}
            unit="µW"
            variant="secondary"
          />
        </div>
      </CleanCard>

      {/* Competitive Analysis Table */}
      <CleanCard className="tilde-p-6" variant="glass">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">ALU Competitive Analysis</h3>
        <div className="tilde-overflow-x-auto">
          <table className="tilde-w-full tilde-text-left">
            <thead>
              <tr className="tilde-border-b tilde-border-white-20">
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">ALU Type</th>
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">Gates</th>
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">Area (µm²)</th>
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">Power (µW)</th>
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">Density</th>
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">Efficiency</th>
                <th className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">Tilde Advantage</th>
              </tr>
            </thead>
            <tbody className="tilde-divide-y tilde-divide-white-10">
              <tr className="tilde-bg-white-10">
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-semibold tilde-text-408BCA">
                  Tilde ALU (β={beta.toFixed(1)})
                </td>
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{tildeMetrics.logicGates}</td>
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{tildeMetrics.area.toFixed(2)}</td>
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{(tildeMetrics.power / 1000).toFixed(2)}</td>
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{tildeMetrics.computingDensity.toFixed(1)}</td>
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{tildeMetrics.energyEfficiency.toFixed(0)}</td>
                <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-semibold tilde-text-408BCA">Baseline</td>
              </tr>
              {conventionalMetrics.map((metric) => (
                <tr key={metric.format}>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-font-medium tilde-text-white">
                    {metric.format.replace('_', ' ')}
                  </td>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{metric.logicGates}</td>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{metric.area.toFixed(2)}</td>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{(metric.power / 1000).toFixed(2)}</td>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{metric.computingDensity.toFixed(1)}</td>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs tilde-text-white-80">{metric.energyEfficiency.toFixed(0)}</td>
                  <td className="tilde-px-3 tilde-py-3 tilde-text-xs">
                    <span className="tilde-text-408BCA tilde-font-semibold">
                      {(tildeMetrics.computingDensity / metric.computingDensity).toFixed(1)}× density
                    </span>
                    <br />
                    <span className="tilde-text-white-60 tilde-font-semibold">
                      {(tildeMetrics.energyEfficiency / metric.energyEfficiency).toFixed(1)}× efficiency
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CleanCard>
    </div>
  );
};

const VisualizationsTab = ({ beta, operation, a }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: 'white' } } },
    scales: {
      y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  const betaSequenceData = useMemo(() => {
    const labels = Array.from({ length: 11 }, (_, i) => i);
    return {
      labels,
      datasets: [
        { label: `β = ${beta.toFixed(2)}`, data: labels.map(n => Math.pow(beta, n)), borderColor: '#408BCA', backgroundColor: 'rgba(64, 139, 202, 0.2)', tension: 0.1, fill: true },
        { label: 'β = 1.5 (Reference)', data: labels.map(n => Math.pow(1.5, n)), borderColor: '#8884d8', backgroundColor: 'rgba(136, 132, 216, 0.2)', tension: 0.1, fill: false, borderDash: [5, 5] },
      ]
    };
  }, [beta]);

  const lutData = useMemo(() => {
    const labels = Array.from({ length: 16 }, (_, i) => i);
    return {
      labels,
      datasets: [{
        label: 'LUT Value',
        data: labels.map(d => getLutValue(d, beta)),
        borderColor: '#DFA01E',
        backgroundColor: 'rgba(223, 160, 30, 0.2)',
        fill: true,
        stepped: true,
      }]
    };
  }, [beta]);

  const errorChartData = useMemo(() => {
    const labels = Array.from({ length: 20 }, (_, i) => 1.1 + i * 0.2);
    return {
      labels: labels.map(b => b.toFixed(1)),
      datasets: [{
        label: 'Error Percentage',
        data: labels.map(b => 100 * (b - 1) / (b + 1)),
        borderColor: '#E04E1B',
        backgroundColor: 'rgba(224, 78, 27, 0.2)',
        tension: 0.1,
        fill: true,
      }]
    };
  }, []);

  return (
    <div className="tilde-space-y-6">
      <div className="tilde-text-center tilde-mb-8">
        <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white tilde-mb-2">Visualizations</h2>
        <p className="tilde-text-white-80">Interactive charts using Chart.js</p>
      </div>
      <div className="tilde-grid tilde-grid-cols-1 lg:tilde-grid-cols-2 tilde-gap-6">
        <CleanCard className="tilde-p-4 tilde-h-80" variant="elevated">
          <h3 className="tilde-text-center tilde-font-semibold tilde-text-white tilde-mb-2">β-Sequence Growth (βⁿ vs. n)</h3>
          <Line options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, type: 'logarithmic', title: { display: true, text: 'Value (log scale)', color: 'white' } } } }} data={betaSequenceData} />
        </CleanCard>
        <CleanCard className="tilde-p-4 tilde-h-80" variant="elevated">
          <h3 className="tilde-text-center tilde-font-semibold tilde-text-white tilde-mb-2">Lookup Table (LUT) Values</h3>
          <Line options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'LUT Value', color: 'white' } } } }} data={lutData} />
        </CleanCard>
        <CleanCard className="tilde-p-4 tilde-h-80" variant="elevated">
          <h3 className="tilde-text-center tilde-font-semibold tilde-text-white tilde-mb-2">Error Percentage vs. β</h3>
          <Line options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Error %', color: 'white' } } } }} data={errorChartData} />
        </CleanCard>
      </div>
    </div>
  );
};

const ReferenceTab = () => {
  const juliaCode = `# Calculate the addition parameter for a given base β
@inline function β2α_add(β::Float64)::Int
    return ceil(Int, -logβ((β-1)/2, β))
end

# Calculate the carry parameter for a given base β
@inline function β2α_carry(β::Float64)::Int
    return floor(Int, -logβ((β-1)/2, β))
end

# Calculate the delta percentage (error) for a given base β
@inline function β2Δ(β::Float64)::Float64
    return 100(β-1) / (β+1)
end`;

  return (
    <div className="tilde-space-y-6">
      <div className="tilde-text-center tilde-mb-8">
        <h2 className="tilde-text-3xl tilde-font-bold tilde-text-white tilde-mb-2">Formulary & Reference</h2>
        <p className="tilde-text-white-80">Mathematical foundations and implementation details</p>
      </div>

      <CleanCard className="tilde-p-8" variant="glass">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Core Formulas</h3>
        <div className="tilde-space-y-4 tilde-text-center tilde-text-white">
          <KaTeX>{`\\text{add}(a, b) = \\begin{cases} m + \\text{LUT}[d] & \\text{if } d < \\text{carry\\_range} \\\\ m & \\text{otherwise} \\end{cases}`}</KaTeX>
          <KaTeX>{`\\text{sub}(a, b) = \\begin{cases} m - \\text{LUT}[d] & \\text{if } d < \\text{carry\\_range} \\\\ m & \\text{otherwise} \\end{cases}`}</KaTeX>
          <KaTeX>{`\\text{mul}(a, b) = a + b - 1`}</KaTeX>
          <KaTeX>{`\\text{div}(a, b) = a - b + 1`}</KaTeX>
          <p className="tilde-text-sm tilde-text-white-60">Where $d = |a-b|$ and $m = \\max(a,b)$. Special rules apply for zero and identity cases.</p>
        </div>
      </CleanCard>

      <CleanCard className="tilde-p-8" variant="elevated">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Key Parameters</h3>
        <div className="tilde-space-y-4 tilde-text-center tilde-text-white">
          <KaTeX>{`\\alpha_{\\text{add}} = \\lceil -\\log_{\\beta}((\\beta-1)/2) \\rceil`}</KaTeX>
          <KaTeX>{`\\alpha_{\\text{carry}} = \\lfloor -\\log_{\\beta}((\\beta-1)/2) \\rfloor`}</KaTeX>
          <KaTeX>{`\\Delta\\% = 100(\\beta-1)/(\\beta+1)`}</KaTeX>
        </div>
      </CleanCard>

      <CleanCard className="tilde-p-6" variant="default">
        <h3 className="tilde-text-lg tilde-font-semibold tilde-text-white tilde-mb-4">Julia Implementation</h3>
        <pre className="tilde-text-sm tilde-text-green-300 tilde-bg-black-50 tilde-p-4 tilde-rounded-md tilde-overflow-x-auto">
          <code>{juliaCode}</code>
        </pre>
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
            <BetaAnalysisTab beta={beta} lutLength={lutLength} errorPercentage={errorPercentage} />
          )}

          {activeTab === 'hardware' && (
            <HardwareTab beta={beta} bitWidth={bitWidth} lutLength={lutLength} gateCount={gateCount} />
          )}

          {activeTab === 'visualizations' && (
            <VisualizationsTab beta={beta} operation={operation} a={a} />
          )}

          {activeTab === 'reference' && (
            <ReferenceTab />
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
