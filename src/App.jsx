import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader, UploadCloud, FileText, X, Download, ChevronsRight, Award, ClipboardCheck, DollarSign, Users, Clock, BarChart2, Briefcase, Target, CheckCircle, ArrowRight, BrainCircuit, Building, FileSignature, Eye, Sparkles, Copy, FileDown, RefreshCw, AlertTriangle, Check } from 'lucide-react';

// --- Helper Component ---
const Typewriter = ({ text, onComplete }) => {
    const [displayText, setDisplayText] = useState('');
    useEffect(() => {
        let i = 0;
        setDisplayText('');
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
                if (onComplete) onComplete();
            }
        }, 10);
        return () => clearInterval(typingInterval);
    }, [text, onComplete]);

    const markdownToHtml = (mdText) => {
        if (!mdText) return '';
        return mdText
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-6">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-700 mb-3 mt-4">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li class="ml-6 mb-2 list-disc">$1</li>')
            .replace(/\n/g, '<br />');
    };
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(displayText) }} />;
};

// --- Main Application Component ---
export default function App() {
    const [currentPage, setCurrentPage] = useState('landing');
    const [currentStep, setCurrentStep] = useState(1);
    const [file, setFile] = useState(null);
    const [pastedText, setPastedText] = useState('');
    const [url, setUrl] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const [analysisResult, setAnalysisResult] = useState({ summary: '', scopes: [], programs: [], focusAreas: [], requiredSections: [] });
    const [selectedScopes, setSelectedScopes] = useState([]);
    const [selectedPrograms, setSelectedPrograms] = useState([]);
    const [selectedFocusAreas, setSelectedFocusAreas] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [orgDetails, setOrgDetails] = useState({ name: '', mission: '', pastExperience: '', maxBudget: '', timeFrame: '' });
    const [sectionsToGenerate, setSectionsToGenerate] = useState({});
    const [generatedSections, setGeneratedSections] = useState({});
    const [finalProposal, setFinalProposal] = useState('');
    const [finalReview, setFinalReview] = useState('');
    const [refinementRequest, setRefinementRequest] = useState('');
    const [error, setError] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
    const [exportLibsLoaded, setExportLibsLoaded] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy for Word/Docs');
    const [guidanceAcknowledged, setGuidanceAcknowledged] = useState(false);
    const [reviewAcknowledged, setReviewAcknowledged] = useState(false);

    useEffect(() => {
        const pdfScriptId = 'pdfjs-script';
        if (!document.getElementById(pdfScriptId)) {
            const script = document.createElement('script');
            script.id = pdfScriptId;
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.async = true;
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                setPdfjsLoaded(true);
            };
            script.onerror = () => setError("Failed to load PDF library.");
            document.body.appendChild(script);
        }

        const jspdfScriptId = 'jspdf-script';
        if (!document.getElementById(jspdfScriptId)) {
            const script = document.createElement('script');
            script.id = jspdfScriptId;
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.async = true;
            script.onload = () => {
                const h2cScript = document.createElement('script');
                h2cScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                h2cScript.async = true;
                h2cScript.onload = () => setExportLibsLoaded(true);
                document.body.appendChild(h2cScript);
            };
            document.body.appendChild(script);
        }
    }, []);

    const startWizard = () => setCurrentPage('wizard');
    const handleStartOver = () => {
        setCurrentPage('landing');
        setCurrentStep(1);
        setFile(null); setPastedText(''); setUrl(''); setExtractedText('');
        setAnalysisResult({ summary: '', scopes: [], programs: [], focusAreas: [], requiredSections: [] });
        setSelectedScopes([]); setSelectedPrograms([]); setSelectedFocusAreas([]);
        setConcepts([]); setSelectedConcept(null);
        setOrgDetails({ name: '', mission: '', pastExperience: '', maxBudget: '', timeFrame: '' });
        setSectionsToGenerate({}); setGeneratedSections({}); setFinalProposal('');
        setFinalReview(''); setRefinementRequest(''); setError('');
        setGuidanceAcknowledged(false); setReviewAcknowledged(false);
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    
    const onDrop = useCallback(acceptedFiles => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
            setFile(selectedFile); setError('');
            extractTextFromFile(selectedFile);
        } else {
            setError('Please upload a valid PDF or TXT file.');
        }
    }, [pdfjsLoaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled: !pdfjsLoaded });

    const extractTextFromFile = async (fileToProcess) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (fileToProcess.type === 'application/pdf') {
                    if (!pdfjsLoaded || !window.pdfjsLib) { setError("PDF library not ready."); return; }
                    const pdf = await window.pdfjsLib.getDocument({ data: event.target.result }).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                    }
                    setExtractedText(fullText);
                } else {
                    setExtractedText(event.target.result);
                }
            } catch (e) { setError(`Error reading file: ${e.message}`); }
        };
        reader.onerror = () => setError('Failed to read file.');
        if (fileToProcess.type === 'application/pdf') reader.readAsArrayBuffer(fileToProcess);
        else reader.readAsText(fileToProcess);
    };
    
    const runAIPromise = async (prompt) => {
        try {
            const apiKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : "";
            if (!apiKey && window.location.hostname !== 'localhost') {
                 setError("API Key is not configured. Please set it in your Vercel project settings.");
                 return null;
            }

            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory, generationConfig: { temperature: 0.5, maxOutputTokens: 8192 } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } 
            
            const finishReason = result.candidates?.[0]?.finishReason;
            if (finishReason === "MAX_TOKENS") {
                console.error("AI response truncated due to max tokens:", result);
                throw new Error("The AI's response was too long and was cut off. Please try generating fewer sections at once or simplifying the input.");
            }
            
            if (result.promptFeedback?.blockReason) {
                console.error("AI prompt blocked:", result.promptFeedback);
                throw new Error(`AI analysis failed. Reason: ${result.promptFeedback.blockReason}. Please try rephrasing your input text.`);
            }

            console.error("Invalid AI response structure:", result);
            throw new Error("Invalid response structure from AI. The model may have returned an empty response.");

        } catch (e) {
            setError(e.message);
            return null;
        }
    };

    const analyzeText = (textToAnalyze) => {
        const prompt = `
            Analyze the following grant funding announcement text. Be thorough. Respond with a valid JSON object containing five keys: "summary", "scopes", "programs", "focusAreas", and "requiredSections".
            1.  "summary": A concise, bulleted summary of the key requirements, eligibility, and evaluation criteria. Use '\\n' for new lines.
            2.  "scopes": An array of objects for selectable "Scopes of Service". Each object must have a "name" and a "description". If none are found, return an empty array [].
            3.  "programs": An array of objects for selectable "Program Areas" or "Activities". Each object must have a "name" and a "description". If none are found, return an empty array [].
            4.  "focusAreas": An array of objects for selectable "Focus Areas" or "Priorities". Each object must have a "name" and a "description". If none are found, return an empty array [].
            5.  "requiredSections": An array of strings listing the exact titles of all required proposal sections as outlined in the document. If not specified, provide a standard list.
            Your entire response MUST be ONLY the JSON object, with no introductory text, code fences, or explanations.
            ---
            ${textToAnalyze}
            ---
        `;
        setIsLoading(true);
        setError('');
        runAIPromise(prompt).then(responseString => {
            if (responseString) {
                let parsedResult = null;
                try {
                    const jsonMatch = responseString.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        let jsonString = jsonMatch[0];
                        jsonString = jsonString.replace(/,(?=\s*[}\]])/g, ''); // Clean trailing commas
                        parsedResult = JSON.parse(jsonString);
                    }
                } catch (e) {
                    console.error("JSON parsing failed after cleaning:", e);
                }

                if (parsedResult && typeof parsedResult === 'object') {
                    const validatedResult = {
                        summary: parsedResult.summary || 'No summary provided.',
                        scopes: Array.isArray(parsedResult.scopes) ? parsedResult.scopes : [],
                        programs: Array.isArray(parsedResult.programs) ? parsedResult.programs : [],
                        focusAreas: Array.isArray(parsedResult.focusAreas) ? parsedResult.focusAreas : [],
                        requiredSections: Array.isArray(parsedResult.requiredSections) && parsedResult.requiredSections.length > 0 ? parsedResult.requiredSections : Object.keys(sectionsToGenerate),
                    };
                    
                    const dynamicSections = validatedResult.requiredSections.reduce((acc, section) => {
                        acc[section] = true;
                        return acc;
                    }, {});
                    
                    setAnalysisResult(validatedResult);
                    setSectionsToGenerate(dynamicSections);
                    setSelectedScopes([]);
                    setSelectedPrograms([]);
                    setSelectedFocusAreas([]);
                    nextStep();
                } else {
                    console.error("Failed to parse AI analysis: No valid JSON object found in response.", responseString);
                    setError("AI analysis could not be structured. Proceeding with summary only.");
                    setAnalysisResult({ ...analysisResult, summary: responseString });
                    nextStep();
                }
            }
            setIsLoading(false);
        });
    };

    const fetchFromUrlAndAnalyze = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                 if(response.status === 403) {
                    throw new Error("Could not fetch content from the URL. The website may be blocking automated access. Please try copying and pasting the text instead.");
                }
                throw new Error(`Failed to fetch content. Status: ${response.status}`);
            }
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const textContent = doc.body.textContent || "";
            if (!textContent.trim()) {
                throw new Error("Could not extract meaningful text from the URL.");
            }
            setExtractedText(textContent);
            analyzeText(textContent);
        } catch (e) {
            setError(e.message);
            setIsLoading(false);
        }
    };

    const handleAnalyze = () => {
        if (url) {
            fetchFromUrlAndAnalyze();
        } else {
            analyzeText(extractedText || pastedText);
        }
    };

    const handleSuggestConcepts = () => {
        const prompt = `
            Based on the following funding announcement analysis and user selections, suggest 3 distinct project concepts.
            Your response MUST be a valid JSON array of objects, where each object has a "name" and a "description".
            
            ANALYSIS:
            ${analysisResult.summary}

            USER SELECTIONS:
            - Selected Scopes of Service: ${selectedScopes.join(', ') || 'Not specified'}
            - Selected Programs: ${selectedPrograms.join(', ') || 'Not specified'}
            - Selected Focus Areas: ${selectedFocusAreas.join(', ') || 'Not specified'}

            TASK: Return a JSON array of 3 project concepts. Each concept should have a "name" (title) and a "description" (2-3 sentences).
        `;
        setIsLoading(true);
        runAIPromise(prompt).then(responseString => {
            if (responseString) {
                let parsedResult = [];
                try {
                    const jsonMatch = responseString.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        let jsonString = jsonMatch[0];
                        jsonString = jsonString.replace(/,(?=\s*[}\]])/g, '');
                        parsedResult = JSON.parse(jsonString);
                    }
                } catch (e) {
                    setError("AI returned invalid concept format.");
                }
                setConcepts(parsedResult);
                if (parsedResult.length > 0) {
                    setSelectedConcept(parsedResult[0]);
                }
                nextStep();
            }
            setIsLoading(false);
        });
    };

    const handleGenerateSections = async () => {
        setCurrentStep(6);
        setIsLoading(true);
        
        let tempGeneratedSections = {};
        const fullProposalText = [];

        const basePrompt = `
            You are an expert grant writer. Ensure your response is well-written, professional, and free of typos. Use the following information to generate the requested proposal section.
            
            FUNDER REQUIREMENTS:
            ${analysisResult.summary}

            USER SELECTIONS:
            - Selected Scopes of Service: ${selectedScopes.join(', ') || 'Not specified'}
            - Selected Programs: ${selectedPrograms.join(', ') || 'Not specified'}
            - Selected Focus Areas: ${selectedFocusAreas.join(', ') || 'Not specified'}
            - Selected Project Concept: ${selectedConcept?.name || 'Not specified'}

            ORGANIZATION & PROJECT DETAILS:
            - Organization Name: ${orgDetails.name}
            - Mission: ${orgDetails.mission}
            - Past Experience: ${orgDetails.pastExperience}
            - Maximum Budget: $${orgDetails.maxBudget || 'Not specified'}
            - Time Frame: ${orgDetails.timeFrame || 'Not specified'} months
        `;
        
        const sectionsToRun = Object.entries(sectionsToGenerate).filter(([, value]) => value).map(([key]) => key);

        for (const key of sectionsToRun) {
            let specificTask = `Write the complete grant proposal section titled "${key}". Ensure the content is detailed, persuasive, and directly addresses the requirements for this section as outlined in the funding announcement analysis.`;

            if (key.toLowerCase().includes('budget')) {
                specificTask = `
                    For the section titled "${key}", generate a detailed line-item budget and a comprehensive budget narrative.
                    **DO NOT USE A MARKDOWN TABLE.**
                    Format the output using headings for each category (e.g., ### Personnel) and bullet points for each line item, followed immediately by its narrative justification. The total budget should be realistic for a ${orgDetails.timeFrame || '12'}-month project and should not exceed $${orgDetails.maxBudget || '100000'}.
                    
                    Example Format:
                    ### Personnel
                    * **Project Director (0.5 FTE): $30,000**
                        * *Justification:* Funds are requested for a half-time Project Director...
                `;
            } else if (key.toLowerCase().includes('outcome') || key.toLowerCase().includes('evaluation')) {
                 specificTask = `
                    For the section titled "${key}", generate a list of measurable outcomes.
                    **DO NOT USE A MARKDOWN TABLE.**
                    Format the output using headings for each outcome area and bullet points for the details.
                    
                    Example Format:
                    ### Outcome Area: Increased Financial Literacy
                    * **Specific Outcome:** Participants will improve their financial management skills.
                    * **Key Indicators:** 80% of participants will create a personal budget.
                    * **Data Collection Method(s):** Pre- and post-program surveys; review of participant-created budgets.
                    * **Frequency:** At program entry and exit.

                    Follow this with a brief narrative explaining how this data will be used for Continuous Quality Improvement (CQI).
                `;
            }

            const sectionPrompt = `${basePrompt}\n\nTASK: ${specificTask}`;
            const generatedText = await runAIPromise(sectionPrompt);
            const textToUse = `## ${key}\n\n` + (generatedText || `Could not generate the '${key}' section.`);
            
            tempGeneratedSections[key] = textToUse;
            setGeneratedSections(prev => ({ ...prev, [key]: textToUse }));
        }
        
        const assembledProposal = sectionsToRun.map(key => tempGeneratedSections[key]).join('\n\n\n');
        setFinalProposal(assembledProposal);
        
        // Now, run the final review
        const reviewPrompt = `
            Act as a meticulous grant reviewer. I have generated a grant proposal based on a funding announcement.
            First, here is the summary of the funder's requirements:
            ---
            ${analysisResult.summary}
            ---
            Now, here is the full generated proposal:
            ---
            ${assembledProposal}
            ---
            Your task is to provide a final review. Ensure your writing is professional, clear, and free of typos. Identify the proposal's strengths and, most importantly, provide a bulleted list of specific, actionable suggestions for any final refinements that could boost the score. Check for alignment with requirements, clarity, persuasiveness, and any potential disqualifiers.
        `;
        const reviewText = await runAIPromise(reviewPrompt);
        setFinalReview(reviewText || "Could not generate a final review.");

        setIsLoading(false);
        nextStep(); // Move to the new Final Review step
    };

    const handleRefinement = async () => {
        setIsLoading(true);
        const refinementPrompt = `
            You are an expert grant writer. A draft proposal has been generated. Your task is to revise it based on the AI's own review and additional user instructions.
            
            **Original Funder Requirements Summary:**
            ---
            ${analysisResult.summary}
            ---
            **First Draft of the Proposal:**
            ---
            ${finalProposal}
            ---
            **AI's Review and Suggestions:**
            ---
            ${finalReview}
            ---
            **User's Additional Refinement Requests:**
            ---
            ${refinementRequest}
            ---
            **TASK:**
            Rewrite and return the **entire, complete, and improved** proposal, incorporating the suggestions from the AI review and the user's requests. Ensure the final output is a single, cohesive document that is polished and ready for submission.
        `;
        
        const refinedProposal = await runAIPromise(refinementPrompt);
        if (refinedProposal) {
            setFinalProposal(refinedProposal);
            setRefinementRequest('');
        }
        setIsLoading(false);
        nextStep(); // Move to the final download step
    };

    const handleSelectionChange = (category, itemName) => {
        const setters = {
            selectedScopes: setSelectedScopes,
            selectedPrograms: setSelectedPrograms,
            selectedFocusAreas: setSelectedFocusAreas,
        };
        const getter = {
            selectedScopes: selectedScopes,
            selectedPrograms: selectedPrograms,
            selectedFocusAreas: selectedFocusAreas,
        }

        const setSelection = setters[category];
        const currentSelection = getter[category];
        
        if (setSelection && currentSelection) {
            const newSelection = currentSelection.includes(itemName)
                ? currentSelection.filter(item => item !== itemName)
                : [...currentSelection, itemName];
            setSelection(newSelection);
        }
    };
    
    // --- Export Functions ---
    const getSafeTitle = () => {
        const titleMatch = finalProposal.match(/^## (.*$)/m);
        if (titleMatch && titleMatch[1]) {
            return titleMatch[1].replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
        }
        return 'grant_proposal';
    }

    const downloadAsMarkdown = () => {
        if (!finalProposal) { setError("No proposal content to download."); return; }
        const blob = new Blob([finalProposal], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${getSafeTitle()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAsPdf = () => {
        if (!finalProposal || !exportLibsLoaded) {
            setError("Required libraries not loaded or no content available.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const source = document.getElementById('proposal-content');
        
        pdf.html(source, {
            callback: function (doc) {
                doc.save(`${getSafeTitle()}.pdf`);
            },
            x: 40,
            y: 40,
            width: 522,
            windowWidth: 1000
        });
    };

    const copyAsRichText = () => {
        if (!finalProposal) {
            setError("No content to copy.");
            return;
        }
    
        const html = markdownToHtml(finalProposal);
    
        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.position = 'fixed';
        container.style.pointerEvents = 'none';
        container.style.opacity = 0;
        document.body.appendChild(container);
    
        const range = document.createRange();
        range.selectNode(container);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setCopyStatus('Copied!');
                setTimeout(() => setCopyStatus('Copy for Word/Docs'), 2000);
            } else {
                throw new Error('Copy command was not successful.');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            setError("Could not copy to clipboard. Your browser might not support this feature.");
        }
    
        selection.removeAllRanges();
        document.body.removeChild(container);
    };

    const markdownToHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.5em; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.6em;">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.25em; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em;">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<p style="margin-left: 1.5em; text-indent: -1.5em;">&bull;&nbsp;&nbsp;&nbsp;$1</p>')
            .replace(/\n/g, '<br />');
    };

    // --- Render Logic ---
    const steps = [
        { id: 1, title: 'Upload Document', icon: <UploadCloud /> },
        { id: 2, title: 'AI Analysis', icon: <BrainCircuit /> },
        { id: 3, title: 'Project Concepts', icon: <Sparkles /> },
        { id: 4, title: 'Organization Details', icon: <Building /> },
        { id: 5, title: 'Select Sections', icon: <ClipboardCheck /> },
        { id: 6, title: 'Generate Proposal', icon: <FileSignature /> },
        { id: 7, title: 'Final AI Review', icon: <Check />},
        { id: 8, title: 'Download', icon: <Eye /> },
    ];
    
    if (currentPage === 'landing') {
        const features = [
            { icon: <BrainCircuit />, title: "AI-Powered Analysis", description: "Deeply analyzes your funding documents to extract key requirements and priorities." },
            { icon: <Sparkles />, title: "Strategic Suggestions", description: "Recommends project concepts tailored to funder priorities and your experience." },
            { icon: <FileSignature />, title: "Section-by-Section Generation", description: "Generate only the sections you need, with real-time progress visualization." },
            { icon: <Target />, title: "Optimized for Scoring", description: "Crafts persuasive, highly-readable content designed to maximize your evaluation score." },
        ];
        return (
            <div className="bg-white text-gray-800">
                <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-600">Easy Grant Writer</h1>
                        <p className="text-sm text-gray-500 -mt-1">Your AI Partner in Grant Writing</p>
                    </div>
                    <button onClick={startWizard} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition">Get Started</button>
                </header>
                <main>
                    <section className="text-center py-20 px-6 bg-gray-50">
                        <h2 className="text-5xl font-extrabold mb-4">The Easy Way to Write Winning Grant Proposals.</h2>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">From RFP to ready-to-submit, faster. Leverage AI to analyze funding opportunities, develop strategic concepts, and write compelling proposals that get noticed.</p>
                        <button onClick={startWizard} className="bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                            Start Your Proposal Now <ArrowRight className="inline ml-2" />
                        </button>
                    </section>
                    <section id="features" className="py-20 px-6">
                        <div className="container mx-auto">
                            <h3 className="text-4xl font-bold text-center mb-12">Features</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {features.map((feature, i) => (
                                    <div key={i} className="bg-gray-50 p-8 rounded-2xl border border-gray-200 text-center">
                                        <div className="bg-blue-100 text-blue-600 p-4 rounded-full inline-block mb-4">{React.cloneElement(feature.icon, { size: 32 })}</div>
                                        <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    <section id="how-it-works" className="py-20 px-6 bg-gray-50">
                        <div className="container mx-auto">
                            <h3 className="text-4xl font-bold text-center mb-12">How It Works</h3>
                            <div className="relative">
                                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 -translate-y-1/2"></div>
                                 <div className="grid md:grid-cols-3 gap-12 text-center relative">
                                    <div className="space-y-4"><div className="bg-white border-2 border-blue-500 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">1</div><h4 className="text-xl font-semibold">Upload & Analyze</h4><p className="text-gray-600">Provide the funder's guidelines (PDF, TXT, or pasted text). Our AI breaks it down in seconds.</p></div>
                                    <div className="space-y-4"><div className="bg-white border-2 border-blue-500 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">2</div><h4 className="text-xl font-semibold">Develop & Refine</h4><p className="text-gray-600">Get project concept suggestions, input your organization's details, and select the proposal sections you need.</p></div>
                                    <div className="space-y-4"><div className="bg-white border-2 border-blue-500 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">3</div><h4 className="text-xl font-semibold">Generate & Download</h4><p className="text-gray-600">Watch as your proposal is written in real-time. Review the final document and download it with one click.</p></div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section id="pricing" className="py-20 px-6">
                        <div className="container mx-auto max-w-4xl">
                            <h3 className="text-4xl font-bold text-center mb-12">Pricing</h3>
                            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200 text-center">
                                <h4 className="text-3xl font-bold mb-4">Easy Grant Writer Pro</h4>
                                <p className="text-gray-600 mb-6">Access all features, unlimited proposals, and priority support.</p>
                                <div className="text-5xl font-extrabold mb-6">$49 <span className="text-xl font-medium text-gray-500">/ month</span></div>
                                <button onClick={startWizard} className="w-full bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">Start Your Free 7-Day Trial</button>
                            </div>
                        </div>
                    </section>
                </main>
                <footer className="container mx-auto px-6 py-10 text-center text-gray-500">
                    <p className="text-sm"><strong>Disclaimer:</strong> Easy Grant Writer is a powerful tool designed to assist in creating high-quality grant proposals. While it aims to produce competitive and compliant documents, its use does not guarantee a grant award. Funding decisions depend on numerous factors, including the merits of the project, the funder's priorities, and the quality of competing applications.</p>
                    <p className="text-xs mt-4">&copy; {new Date().getFullYear()} Easy Grant Writer. All Rights Reserved.</p>
                </footer>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border p-8 relative">
                <button onClick={handleStartOver} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-medium">
                    <RefreshCw size={14} />
                    Start Over
                </button>
                <div className="flex items-center justify-center mb-8">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {currentStep > step.id ? <CheckCircle /> : step.icon}
                                </div>
                                <p className={`mt-2 text-xs text-center font-semibold ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.title}</p>
                            </div>
                            {index < steps.length - 1 && <div className={`flex-auto h-1 transition-colors duration-300 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">{steps.find(s => s.id === currentStep).title}</h2>
                <p className="text-gray-500 text-center mb-8">Step {currentStep} of {steps.length}</p>
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg mb-4 text-center">{error}</p>}
                {renderStep()}
            </div>
        </div>
    );
}
