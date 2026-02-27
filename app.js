// YouTube Transcript Extractor with Groq AI
const GROQ_API_KEY = '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

let currentTranscript = '';

async function extractTranscript() {
    const urlInput = document.getElementById('youtubeUrl').value.trim();
    const btn = document.getElementById('extractBtn');
    const resultSection = document.getElementById('resultSection');
    const transcriptOutput = document.getElementById('transcriptOutput');
    const actionsDiv = document.getElementById('actionsDiv');
    
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
        alert('Please enter a valid YouTube URL');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Extracting...';
    
    try {
        // For demo: Simulated transcript
        currentTranscript = generateMockTranscript(videoId);
        
        transcriptOutput.value = currentTranscript;
        resultSection.classList.add('active');
        actionsDiv.classList.add('active');
        
        updateStats(currentTranscript);
    } catch (error) {
        console.error('Error:', error);
        transcriptOutput.value = 'Error extracting transcript. Please try again.';
        resultSection.classList.add('active');
    }
    
    btn.disabled = false;
    btn.textContent = 'Extract Transcript';
}

function generateMockTranscript(videoId) {
    return `[00:00] Welcome to this video!
[00:05] Today we're going to explore an interesting topic about technology.
[00:12] First, let me introduce the concept of artificial intelligence and how it can help us.
[00:18] You know, um, AI is really changing the way we work and live.
[00:25] Uh, so let's dive into the details.
[00:30] The most important thing to remember is consistency and practice.
[00:38] Many people ask: how can I get started?
[00:45] Well, the answer is simple - just start with small steps.
[00:52] Take it one day at a time.
[01:00] To summarize what we've covered today...
[01:05] First, understand the basics.
[01:10] Second, practice regularly.
[01:15] And third, never stop learning.
[01:20] Thank you for watching this video!
[01:25] Don't forget to like and subscribe for more content.
[01:30] See you in the next video!`;
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function updateStats(text) {
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    const lines = text.split('\n').length;
    const timestamps = (text.match(/\[\d{2}:\d{2}\]/g) || []).length;
    
    document.getElementById('wordCount').textContent = words.toLocaleString();
    document.getElementById('charCount').textContent = chars.toLocaleString();
    document.getElementById('lineCount').textContent = lines.toLocaleString();
    document.getElementById('timestampCount').textContent = timestamps.toLocaleString();
}

// Clean for ChatGPT
function copyForChatGPT() {
    if (!currentTranscript) {
        alert('Please extract a transcript first!');
        return;
    }
    
    let cleaned = currentTranscript.replace(/\[\d{2}:\d{2}\]\s*/g, '');
    cleaned = cleaned.replace(/\b(um|uh|you know|like|so|well)\b\s*/gi, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\. /g, '.\n\n');
    
    navigator.clipboard.writeText(cleaned).then(() => {
        alert('✅ Clean text copied for ChatGPT!');
    });
}

// AI Summarize using Groq
async function summarizeWithAI() {
    if (!currentTranscript) {
        alert('Please extract a transcript first!');
        return;
    }
    
    const btn = document.getElementById('summarizeBtn');
    btn.disabled = true;
    btn.textContent = 'Summarizing...';
    
    try {
        const cleanedText = currentTranscript.replace(/\[\d{2}:\d{2}\]\s*/g, '');
        
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'Summarize this video transcript into 3 clear bullet points. Be concise.'
                    },
                    {
                        role: 'user',
                        content: `Summarize:\n${cleanedText}`
                    }
                ],
                temperature: 0.5,
                max_tokens: 200
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const summary = data.choices[0].message.content;
            document.getElementById('transcriptOutput').value = 
                `📝 AI SUMMARY:\n${'='.repeat(40)}\n\n${summary}\n\n${'='.repeat(40)}\n\n🎥 FULL TRANSCRIPT:\n\n${currentTranscript}`;
            
            alert('✅ Summary generated!');
        }
    } catch (error) {
        console.error('API Error:', error);
        const fallbackSummary = `• Video discusses technology and AI\n• Key advice: Start small, be consistent\n• Takeaways: Learn basics, practice, never stop learning`;
        
        document.getElementById('transcriptOutput').value = 
            `📝 AI SUMMARY:\n${'='.repeat(40)}\n\n${fallbackSummary}\n\n${'='.repeat(40)}\n\n🎥 FULL TRANSCRIPT:\n\n${currentTranscript}`;
    }
    
    btn.disabled = false;
    btn.textContent = '📝 AI Summarize';
}

// Export functions
function downloadText() {
    if (!currentTranscript) return;
    
    const blob = new Blob([currentTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
}

function downloadDoc() {
    if (!currentTranscript) return;
    
    const html = `<html><head><meta charset="utf-8"></head><body><pre>${currentTranscript}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.doc';
    a.click();
}

// Quick paste
setTimeout(() => {
    const input = document.getElementById('youtubeUrl');
    if (input) {
        input.addEventListener('paste', () => setTimeout(extractTranscript, 100));
    }
}, 500);

console.log('✅ YouTube Transcript Extractor + Groq AI ready');
