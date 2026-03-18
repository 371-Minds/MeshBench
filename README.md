# MetaBench: AGI Cognitive Load Benchmark Platform

![MetaBench](https://img.shields.io/badge/Status-Active-success) ![DeepMind Kaggle](https://img.shields.io/badge/Target-DeepMind%20Kaggle%20AGI-blue)

MetaBench is a visual platform designed to help domain experts, researchers, and prompt engineers build, test, and export advanced cognitive benchmarks for Artificial General Intelligence (AGI) models. It was specifically built to support submissions for the **Google DeepMind AGI Kaggle Competition**.

## 🧠 The Vision
Today's AI models achieve high scores on standard benchmarks through pattern matching and data recall rather than true reasoning. MetaBench solves this by allowing researchers to design **Procedural Cognitive Stress Tests**. 

By introducing the novel **Cognitive Load Theory** domain, MetaBench evaluates a model's ability to maintain factual accuracy while navigating extreme structural and linguistic constraints, effectively neutralizing standard predictive token generation and forcing true planning and reasoning.

## ✨ Key Features
* **Visual Benchmark Builder:** No-code interface for designing complex system prompts and user templates.
* **Procedural Variable Injection:** Define variables using `[Brackets]` to dynamically generate thousands of test variations.
* **Live Model Testing:** Integrated with Gemini 3.1 Pro to immediately test prompt effectiveness and constraint adherence.
* **Automated Constraint Analysis:** Real-time evaluation engine that checks model outputs against strict rules (e.g., exact sentence counts, forbidden characters, specific ending words).
* **Kaggle JSONL Export:** One-click export to the exact format required for the DeepMind Kaggle competition.

## 🔬 Supported Cognitive Domains
1. **Learning:** Few-shot adaptation and rule inference.
2. **Metacognition:** Self-correction and confidence calibration.
3. **Attention:** Needle-in-a-haystack retrieval and distraction resistance.
4. **Executive Function:** Multi-step planning and constraint satisfaction.
5. **Social Cognition:** Theory of mind and perspective taking.
6. **🌟 Cognitive Load (Custom):** Extreme structural constraints to measure true reasoning capacity and reduce hallucinations.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* A Gemini API Key (Set in your environment variables or AI Studio secrets)

### Installation
```bash
npm install
npm run dev
```

### Usage
1. Select a cognitive domain from the left sidebar.
2. Modify the System Prompt and User Prompt Template.
3. Use `[Variable]` syntax to create dynamic inputs.
4. Click **Live Test** to evaluate the benchmark against Gemini.
5. Click **Export to Kaggle JSONL** to download your dataset.

## 🤝 Contributing
This project was developed as a submission for the DeepMind AGI Hackathon. Contributions to expand the automated constraint analysis engine or add new cognitive domains are welcome.
