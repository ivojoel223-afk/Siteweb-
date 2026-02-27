#!/usr/bin/env python3
"""Backend API pour extraire les transcripts YouTube."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound

app = Flask(__name__)
CORS(app)  # Autoriser les appels depuis le frontend

def extract_video_id(url):
    """Extrait l'ID vidéo depuis l'URL YouTube."""
    import re
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/v/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

@app.route('/api/transcript', methods=['POST'])
def get_transcript():
    """Endpoint pour récupérer le transcript."""
    data = request.get_json()
    url = data.get('url', '')
    lang = data.get('language', 'fr')  # fr, en, es
    
    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': 'URL YouTube invalide'}), 400
    
    try:
        # Récupérer le transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang, 'en', 'es', 'fr'])
        
        # Formater le résultat
        formatted_lines = []
        for entry in transcript_list:
            start = entry['start']
            text = entry['text']
            # Convertir en format [MM:SS]
            minutes = int(start // 60)
            seconds = int(start % 60)
            timestamp = f"[{minutes:02d}:{seconds:02d}]"
            formatted_lines.append(f"{timestamp} {text}")
        
        full_transcript = '\n'.join(formatted_lines)
        
        return jsonify({
            'success': True,
            'videoId': video_id,
            'language': lang,
            'transcript': full_transcript,
            'wordCount': len(full_transcript.split()),
            'charCount': len(full_transcript)
        })
        
    except TranscriptsDisabled:
        return jsonify({'error': 'Les sous-titres sont désactivés pour cette vidéo'}), 404
    except NoTranscriptFound:
        return jsonify({'error': f'Aucun transcript trouvé en {lang}. Essayez une autre langue.'}), 404
    except Exception as e:
        return jsonify({'error': f'Erreur: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check."""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
