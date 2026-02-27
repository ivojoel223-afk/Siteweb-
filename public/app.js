// 🎥 YouTube Transcript Extractor - NoTimeSub
// API Backend URL (à remplacer par ton URL Render)
const API_URL = 'https://yt-transcript-backend.onrender.com/api/transcript';

let currentTranscript = '';
let currentLanguage = 'fr';
let currentVideoId = '';

// Détecte la langue du navigateur
const userLang = navigator.language || navigator.userLanguage;
if (userLang.startsWith('en')) currentLanguage = 'en';
if (userLang.startsWith('es')) currentLanguage = 'es';

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) btn.classList.add('active');
    });
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function extractTranscript() {
    const urlInput = document.getElementById('youtubeUrl');
    const btn = document.getElementById('extractBtn');
    const loading = document.getElementById('loading');
    const resultSection = document.getElementById('resultSection');
    const errorMsg = document.getElementById('errorMsg');
    
    const url = urlInput.value.trim();
    currentVideoId = extractVideoId(url);
    
    if (!currentVideoId) {
        errorMsg.textContent = '❌ URL YouTube invalide. Utilisez un lien comme https://www.youtube.com/watch?v=... ou https://youtu.be/...';
        return;
    }
    
    errorMsg.textContent = '';
    btn.disabled = true;
    btn.textContent = '⏳ Extraction en cours...';
    loading.classList.add('active');
    resultSection.classList.remove('active');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, language: currentLanguage })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erreur lors de l\'extraction');
        }
        
        currentTranscript = data.transcript;
        document.getElementById('transcriptOutput').value = currentTranscript;
        
        // Stats
        document.getElementById('wordCount').textContent = data.wordCount?.toLocaleString() || '0';
        document.getElementById('charCount').textContent = data.charCount?.toLocaleString() || '0';
        const durationMin = Math.floor(data.duration / 60);
        document.getElementById('duration').textContent = durationMin > 0 
            ? `${durationMin} min ${data.duration % 60}s`
            : `${data.duration}s`;
        
        resultSection.classList.add('active');
        
    } catch (error) {
        console.error('Erreur:', error);
        errorMsg.innerHTML = `
            <strong>⚠️ Erreur:</strong> ${error.message}<br>
            <small>Assurez-vous que la vidéo a des sous-titres activés.</small>
        `;
    } finally {
        btn.disabled = false;
        btn.textContent = '🎬 Extract Transcript';
        loading.classList.remove('active');
    }
}

// ✨ MAGIC CLEAN FOR CHATGPT - Feature clé
function getCleanText() {
    if (!currentTranscript) {
        alert('Veuillez d\'abord extraire un transcript !');
        return;
    }
    
    // Nettoyage intelligent
    let cleaned = currentTranscript
        .replace(/\[\d{2}:\d{2}\]/g, '')           // Supprime timestamps [00:12]
        .replace(/\b(um|uh|you know|like|so|well|euh|hein|alors)\b\s*/gi, '') // Supprime mots parasites
        .replace(/\s+/g, ' ')                      // Double espaces → simple
        .trim();
    
    // Capitalisation intelligente
    cleaned = cleaned.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    // Mise à jour de l'affichage
    document.getElementById('transcriptOutput').value = cleaned;
    currentTranscript = cleaned;
    
    // Feedback visuel
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = '✅ Texte nettoyé !';
    btn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    
    setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
    }, 2000);
    
    // Auto-copy
    navigator.clipboard.writeText(cleaned).then(() => {
        showNotification('📋 Texte nettoyé copié dans le presse-papier !');
    });
}

function copyText() {
    const text = document.getElementById('transcriptOutput').value;
    if (!text) return alert('Aucun texte à copier !');
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('📋 Copié dans le presse-papier !');
    });
}

function downloadText() {
    if (!currentTranscript) return alert('Aucun transcript à télécharger !');
    
    const blob = new Blob([currentTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${currentVideoId || 'youtube'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('💾 Fichier TXT téléchargé !');
}

function downloadDoc() {
    if (!currentTranscript) return alert('Aucun transcript à télécharger !');
    
    const html = `<html><head><meta charset="UTF-8"><title>YouTube Transcript</title></head><body style="font-family:Arial,font-size:12pt"><pre>${currentTranscript.replace(/</g, '&lt;')}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${currentVideoId || 'youtube'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('📄 Fichier DOC téléchargé !');
}

function showNotification(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Auto-extract on paste
setTimeout(() => {
    const input = document.getElementById('youtubeUrl');
    if (input) {
        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                const url = input.value.trim();
                if (extractVideoId(url)) extractTranscript();
            }, 100);
        });
    }
}, 500);

console.log('✅ NoTimeSub - Transcript Extractor Ready');
