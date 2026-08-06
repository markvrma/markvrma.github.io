---
permalink: /
title: "Hi, I'm Mark"
author_profile: true
excerpt: "Data Science Engineer — MLOps, ML systems, and building things from first principles"
redirect_from:
  - /about/
  - /about.html
---

<p class="mv-reveal">
I'm a <span class="mv-tagline">Data Science Engineer</span> at <a href="https://www.314ecorp.com" target="_blank" rel="noopener">314e Corp</a> in Bengaluru, where I build and operate MLOps pipelines for healthcare ML systems — orchestration, distributed data processing, and model serving at scale. Outside of work I write low-level Rust and Python for fun: reimplementing NumPy from scratch, and building terminal tools I actually use every day.
</p>

<div class="mv-reveal">
<span class="mv-section-title">Experience</span>

<div class="mv-timeline">

<div class="mv-timeline-item mv-timeline-item--current">
<div class="mv-timeline-role">Data Science Engineer · 314e Corp <span class="mv-badge">Current</span></div>
<div class="mv-timeline-meta">Bengaluru, India &nbsp;·&nbsp; Jul 2024 – Present</div>
<ul>
<li>Architected and automated a full-scale <strong>MLOps pipeline</strong> for a patient entity-extraction model, raising accuracy from <strong>72% to 94%</strong>; orchestrated fault-tolerant workflows with <strong>Temporal</strong> and deployed on <strong>SkyPilot</strong>, <strong>Hugging Face Endpoints</strong>, and <strong>RunPod</strong> with a human-in-the-loop refinement system.</li>
<li>Re-engineered legacy Python scripts into scalable <strong>PySpark</strong> jobs for large-scale FHIR resources across multiple clients, cutting data-loading time by <strong>~80%</strong>.</li>
<li>Cut model training time from <strong>90 hours to 25 hours</strong> on 500GB+ datasets via targeted hyperparameter tuning, and eliminated OOM errors with a custom memory-efficient iterable dataloader.</li>
<li>Reduced model cold-start time by <strong>77%</strong> by optimizing the serving process and pre-packaging assets into the runtime.</li>
<li>Built a benchmarking suite for Vision-Language Models logged on <strong>ClearML</strong>, and reported a critical bug in Google's Gemma 3 VLM (Flash-Attention SDPA implementation).</li>
</ul>
</div>

<div class="mv-timeline-item">
<div class="mv-timeline-role">Machine Learning Intern · <a href="https://www.banach.sg" target="_blank" rel="noopener">Banach Technologies</a></div>
<div class="mv-timeline-meta">Singapore (Remote) &nbsp;·&nbsp; Apr 2024 – Jul 2024</div>
<ul>
<li>Engineered and optimized <strong>high-frequency trading</strong> strategies, reducing data-processing latency through targeted performance tuning.</li>
<li>Built and deployed ML models from scratch against live market APIs to execute hedging strategies, backed by a comprehensive unittest suite for core trading libraries.</li>
</ul>
</div>

<div class="mv-timeline-item">
<div class="mv-timeline-role">Software / ML Intern · <a href="https://www.alemeno.com" target="_blank" rel="noopener">Alemeno</a></div>
<div class="mv-timeline-meta">Maharashtra (Remote) &nbsp;·&nbsp; Jul 2023 – Apr 2024</div>
<ul>
<li>Built a data-preprocessing pipeline for semantic-segmentation models over large-scale GIS raster data, and implemented distributed computer-vision algorithms (Douglas–Peucker, Jarvis March).</li>
<li>Deployed scalable Django apps on AWS with an end-to-end CI/CD pipeline, and hardened a high-performance raster-processing app through refactoring and unit tests.</li>
</ul>
</div>

<div class="mv-timeline-item">
<div class="mv-timeline-role">Data Analyst · Bewgle</div>
<div class="mv-timeline-meta">Bengaluru (Remote) &nbsp;·&nbsp; May 2022 – Jul 2022</div>
<ul>
<li>Applied NLP techniques to proprietary Amazon-review datasets to deliver product-trend insights and predictive models; automated preprocessing in Python/Bash, cutting data redundancy by <strong>90%</strong>.</li>
</ul>
</div>

</div>
</div>

<div class="mv-reveal">
<span class="mv-section-title">Projects</span>

<div class="mv-project-grid">

<div class="mv-project-card">
<div class="mv-project-title"><a href="https://github.com/markvrma/rumpy" target="_blank" rel="noopener">rumpy</a></div>
<div class="mv-tags"><span class="mv-tag">Rust</span><span class="mv-tag">Systems</span><span class="mv-tag">Benchmarking</span></div>
<div class="mv-project-desc">A zero-dependency NumPy, written from scratch in pure Rust — same internals as the real thing (flat buffer + shape + strides). Reimplements broadcasting, axis reductions, and matmul from first principles, then benchmarks a cache-friendly <code>ikj</code> loop order against BLAS-backed NumPy. Spec-driven with ~30 milestone tests.</div>
<div class="mv-project-links">
<a href="https://github.com/markvrma/rumpy" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

<div class="mv-project-card">
<div class="mv-project-title"><a href="https://github.com/markvrma/yt-music-cli" target="_blank" rel="noopener">msm — YouTube Music CLI</a></div>
<div class="mv-tags"><span class="mv-tag">Python</span><span class="mv-tag">TUI</span><span class="mv-tag">mpv / yt-dlp</span></div>
<div class="mv-project-desc">A terminal player that browses YouTube Music and your local library side by side, plays audio through <code>mpv</code> over its JSON IPC socket, and scrobbles to Last.fm via <code>cmusfm</code>. Vim-style keys, live search, play history, and pixelated album art rendered straight in the terminal.</div>
<div class="mv-project-links">
<a href="https://github.com/markvrma/yt-music-cli" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

<div class="mv-project-card">
<div class="mv-project-title"><a href="https://github.com/markvrma/ml-from-scratch" target="_blank" rel="noopener">ML-from-scratch</a></div>
<div class="mv-tags"><span class="mv-tag">PyTorch</span><span class="mv-tag">Deep Learning</span></div>
<div class="mv-project-desc">Core ML/DL models — backpropagation, CNNs, transformers — implemented from first principles in pure PyTorch, without high-level abstractions.</div>
<div class="mv-project-links">
<a href="https://github.com/markvrma/ml-from-scratch" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

<div class="mv-project-card">
<div class="mv-project-title"><a href="https://github.com/markvrma/resume-parser" target="_blank" rel="noopener">Resume Parser</a></div>
<div class="mv-tags"><span class="mv-tag">LLMs</span><span class="mv-tag">HuggingFace</span><span class="mv-tag">Streamlit</span></div>
<div class="mv-project-desc">An end-to-end LLM-powered resume parser with a modular OOP codebase and a Streamlit UI that turns an uploaded resume into structured JSON.</div>
<div class="mv-project-links">
<a href="https://github.com/markvrma/resume-parser" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

<div class="mv-project-card">
<div class="mv-project-title"><a href="https://github.com/markvrma/medical-waste-classifier" target="_blank" rel="noopener">Medical Waste Classification</a></div>
<div class="mv-tags"><span class="mv-tag">TensorFlow</span><span class="mv-tag">Computer Vision</span></div>
<div class="mv-project-desc">A CNN reaching 98.4% accuracy on medical waste classification, shipped as an interactive TensorFlow.js web app. Findings published in IEEE Xplore.</div>
<div class="mv-project-links">
<a href="https://github.com/markvrma/medical-waste-classifier" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

</div>

<p><em>More on <a href="https://github.com/markvrma" target="_blank" rel="noopener">GitHub →</a></em></p>
</div>

<div class="mv-reveal">
<span class="mv-section-title">Skills</span>

<div class="mv-skill-group">
<div class="mv-skill-group-title">Languages</div>
<div class="mv-pill-row">
<span class="mv-pill">Python</span><span class="mv-pill">C++</span><span class="mv-pill">Rust</span><span class="mv-pill">Bash</span><span class="mv-pill">JavaScript</span>
</div>
</div>

<div class="mv-skill-group">
<div class="mv-skill-group-title">Libraries &amp; Frameworks</div>
<div class="mv-pill-row">
<span class="mv-pill">PyTorch</span><span class="mv-pill">TensorFlow</span><span class="mv-pill">scikit-learn</span><span class="mv-pill">NumPy</span><span class="mv-pill">Pandas</span><span class="mv-pill">OpenCV</span><span class="mv-pill">Rasterio</span><span class="mv-pill">Matplotlib</span><span class="mv-pill">Django</span><span class="mv-pill">Flask</span><span class="mv-pill">FastAPI</span><span class="mv-pill">Dash</span><span class="mv-pill">vLLM</span><span class="mv-pill">SGLang</span><span class="mv-pill">RunPod SDK</span><span class="mv-pill">SkyPilot</span>
</div>
</div>

<div class="mv-skill-group">
<div class="mv-skill-group-title">Tools &amp; Platforms</div>
<div class="mv-pill-row">
<span class="mv-pill">Docker</span><span class="mv-pill">Kubernetes</span><span class="mv-pill">AWS SageMaker</span><span class="mv-pill">MLflow</span><span class="mv-pill">ClearML</span><span class="mv-pill">Temporal</span><span class="mv-pill">Git</span><span class="mv-pill">Linux</span><span class="mv-pill">PostgreSQL</span><span class="mv-pill">Streamlit</span>
</div>
</div>

</div>

<div class="mv-reveal">
<span class="mv-section-title">Education &amp; Certifications</span>

<p><strong>B.Tech, Computer Science</strong> — ABV-IIITM Gwalior, India · SGPA 8.67 · 2024<br>
Relevant coursework: Artificial Intelligence, Statistics, Cloud Computing</p>

<p>DevOps on AWS Specialization &nbsp;·&nbsp; GCP Network Deployment &nbsp;·&nbsp; Open-source contributor <a href="https://github.com/pymc-devs/pymc" target="_blank" rel="noopener">@PyMC</a></p>
</div>
