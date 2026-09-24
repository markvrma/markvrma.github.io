---
permalink: /
title: "Hi, I'm Mark"
author_profile: true
excerpt: "ML Engineer — MLOps, ML systems, and building things from first principles"
redirect_from:
  - /about/
  - /about.html
---

<p class="mv-reveal">
I'm an <span class="mv-tagline">ML Engineer</span> at <a href="https://www.314ecorp.com" target="_blank" rel="noopener">314e Corp</a> in Bengaluru, where I build and operate MLOps pipelines for healthcare ML systems — orchestration, distributed data processing, and model serving at scale. Outside of work I write low-level Rust and Python for fun: reimplementing NumPy from scratch, and building terminal tools I actually use every day.
</p>

<div class="mv-reveal">
<span class="mv-section-title">Experience</span>

<div class="mv-timeline">

<div class="mv-timeline-item mv-timeline-item--current">
<div class="mv-timeline-role">314e Corp <span class="mv-badge">Current</span></div>
<div class="mv-progression">Software Development Engineer (Jan 2025 &ndash; Present) &nbsp;&rarr;&nbsp; Associate Software Development Engineer (Dec 2024 &ndash; Jan 2025) &nbsp;&rarr;&nbsp; Software Development Engineer Intern (Jul 2024 &ndash; Dec 2024)</div>
<div class="mv-timeline-meta">Bengaluru, India</div>
<ul>
<li>Built and owned the <strong>entity-extraction ML stack</strong> behind a clinical document-processing product, taking a fine-tuned 27B vision-language model to <strong>0.96 test accuracy</strong> across 26 clinical entity types in production.</li>
<li>Wrote a 7,600-line model-agnostic <strong>VLM fine-tuning package</strong> on <strong>SkyPilot</strong>, <strong>Temporal</strong> and <strong>ClearML</strong> that trains Gemma 3, Qwen3.5-9B and Qwen3.6-27B through one model-family dispatch layer, rewritten across three generations as the model family changed.</li>
<li>Built the <strong>human-in-the-loop retraining loop</strong> from reviewer feedback through stratified dataset construction to automated deployment, gated by a per-entity F1 regression check that blocks any model regressing beyond a tolerance scaled to its prior score.</li>
<li>Built a weekly <strong>accuracy-drift monitor</strong> separating genuine model regression from reviewer labelling-convention change &mdash; two causes indistinguishable in F1 that demand opposite responses &mdash; using an LLM agent over a purpose-built read-only <strong>MCP server</strong> that reads page OCR to check the document itself.</li>
<li>Wrote the schema-driven entity-extraction layer and a per-field <strong>confidence tree</strong> mapping token logprobs to sequence likelihood, spanning 4 LLM providers and 3 inference engines behind one validated output contract.</li>
<li>Trained a calibrated <strong>XGBoost confidence model</strong> over those logprobs, OCR grounding and text embeddings on <strong>99,427 reviewed extractions</strong>, halving the false-approval rate against the LLM's own confidence at matched coverage (<strong>1.4% vs 2.7%</strong>) and calibrating expected error from 0.139 to 0.004, <strong>retiring 83% of manual entity review</strong>.</li>
<li>Migrated entity-extraction serving from Transformers to <strong>vLLM</strong> to <strong>SGLang</strong> on RunPod serverless, reaching <strong>64 concurrent jobs</strong> per worker with continuous batching, and removed cold-start cost by baking weights into the image and pre-warming triton kernel JIT and vision-encoder init.</li>
<li>Cut model training time from <strong>90 hours to 25 hours</strong> by replacing an iterable dataset with map-style lazy loading and sizing batches from available VRAM, after tracing an 80&nbsp;GB host-RAM exhaustion to a cap that bounded sample count but never bytes.</li>
</ul>
<p>Engineering writeups of this platform, which I contributed to — published by 314e, authored by Dr. Srivatsan Sridhar: <a href="https://www.314e.com/engineering-hub/automated-document-processing-with-dexit-behind-the-scenes-of-ai-document-extraction-and-classification" target="_blank" rel="noopener">AI document extraction &amp; classification</a> &nbsp;·&nbsp; <a href="https://www.314e.com/engineering-hub/cracking-the-code-ai-native-intelligent-document-processing-for-medical-records/" target="_blank" rel="noopener">IDP for medical records</a></p>
</div>

<div class="mv-timeline-item">
<div class="mv-timeline-role">Machine Learning Intern &middot; <a href="https://www.banach.sg" target="_blank" rel="noopener">Banach Technologies</a></div>
<div class="mv-timeline-meta">Singapore (Remote) &nbsp;&middot;&nbsp; Apr 2024 &ndash; Jul 2024</div>
<ul>
<li>Built and deployed ML models against live market APIs to execute <strong>hedging strategies</strong>, cutting data-processing latency through targeted performance tuning and covering the core trading libraries with unit tests.</li>
</ul>
</div>

<div class="mv-timeline-item">
<div class="mv-timeline-role">Software and ML Intern &middot; <a href="https://www.alemeno.com" target="_blank" rel="noopener">Alemeno</a></div>
<div class="mv-timeline-meta">Maharashtra (Remote) &nbsp;&middot;&nbsp; Jul 2023 &ndash; Apr 2024</div>
<ul>
<li>Built a preprocessing pipeline for <strong>semantic-segmentation</strong> models over large-scale GIS raster data, implementing distributed computer-vision algorithms including Douglas&ndash;Peucker and Jarvis March, and deployed <strong>Django</strong> services on AWS behind end-to-end CI/CD.</li>
</ul>
</div>

<div class="mv-timeline-item">
<div class="mv-timeline-role">Data Analyst Intern &middot; Bewgle</div>
<div class="mv-timeline-meta">Bengaluru (Remote) &nbsp;&middot;&nbsp; May 2022 &ndash; Jul 2022</div>
<ul>
<li>Applied <strong>NLP</strong> to proprietary Amazon review datasets for product-trend insight, automating preprocessing in Python and Bash to cut data redundancy <strong>90%</strong>.</li>
</ul>
</div>

</div>
</div>

<div class="mv-reveal">
<span class="mv-section-title">Publication</span>

<div class="mv-project-title"><a href="https://ieeexplore.ieee.org/document/10119431" target="_blank" rel="noopener">Medical Waste Classification using Deep Learning and Convolutional Neural Networks</a></div>
<div class="mv-timeline-meta">First author &nbsp;&middot;&nbsp; 2022 IEEE Conference on Interdisciplinary Approaches in Technology and Management for Social Innovation (IATMSI), Gwalior, India &nbsp;&middot;&nbsp; <strong>cited 25 times</strong></div>
<p>Trained a CNN to <strong>98.4% accuracy</strong> for medical-waste classification and deployed it as an interactive TensorFlow.js web application.</p>
<div class="mv-project-links">
<a href="https://ieeexplore.ieee.org/document/10119431" target="_blank" rel="noopener">IEEE Xplore &rarr;</a>
<a href="https://markvrma.github.io/files/publication1.pdf" target="_blank" rel="noopener">PDF</a>
<a href="https://github.com/markvrma/medical-waste-classifier" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

<div class="mv-reveal">
<span class="mv-section-title">Projects</span>

<div class="mv-project-grid">

<div class="mv-project-card">
<div class="mv-project-title"><a href="/typeset/">unreflowed — a typesetting lab</a></div>
<div class="mv-tags"><span class="mv-tag">JavaScript</span><span class="mv-tag">Canvas</span><span class="mv-tag">Text layout</span></div>
<div class="mv-project-desc">Five experiments built on <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener">pretext</a> that lay out text without asking the DOM. My bio flows around orbs that follow your cursor at 60fps, text fills morphing glyphs, chat bubbles shrinkwrap to their tightest width, and a paragraph drops into a pile and springs back into place. One plate checks pretext's height predictions against real <code>offsetHeight</code> reads, and they match to the pixel.</div>
<div class="mv-project-links">
<a href="/typeset/">Open the lab &rarr;</a>
</div>
</div>

<div class="mv-project-card">
<div class="mv-project-title"><a href="https://swallow-mocha.vercel.app/" target="_blank" rel="noopener">Swallow</a></div>
<div class="mv-tags"><span class="mv-tag">FastAPI</span><span class="mv-tag">React 19</span><span class="mv-tag">PostgreSQL</span></div>
<div class="mv-project-desc">Stop choosing, start watching — rolls a random unseen episode from the shows you follow and never repeats one until the pool is exhausted. Saved &ldquo;controlled random&rdquo; presets narrow the roll to specific shows, seasons, and a maximum episode length. FastAPI + SQLAlchemy 2 over Postgres, Clerk auth, React/Vite frontend, episode data from the TVmaze API.</div>
<div class="mv-project-links">
<a href="https://swallow-mocha.vercel.app/" target="_blank" rel="noopener">Live Demo &rarr;</a>
<a href="https://github.com/markvrma/swallow" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i>Code</a>
</div>
</div>

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
<div class="mv-project-title"><a href="https://github.com/markvrma/resume-parser" target="_blank" rel="noopener">Resume Check</a></div>
<div class="mv-tags"><span class="mv-tag">NLI</span><span class="mv-tag">Transformers.js</span><span class="mv-tag">Client-side</span></div>
<div class="mv-project-desc">Scores a resume against a hand-written hiring rubric, then matches it against a pasted job description with an open-weights NLI model — entirely in the browser, no upload, no backend.</div>
<div class="mv-project-links">
<a href="https://resume-parser-theta-azure.vercel.app/" target="_blank" rel="noopener">Live Demo →</a>
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
