#!/usr/bin/env python3
"""
Fetch YouTube transcript using youtube-transcript-api.
Returns JSON array of segments with text, start, and duration.

Usage:
    python fetch_transcript.py VIDEO_ID [LANG]
    
Output:
    JSON array printed to stdout
"""

import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def fetch_transcript(video_id: str, lang: str = "en") -> list:
    """Fetch transcript for a video."""
    try:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
        
        # Convert to list of dicts
        segments = []
        for snippet in transcript.snippets:
            segments.append({
                "text": snippet.text,
                "start": snippet.start,
                "duration": snippet.duration,
            })
        
        return segments
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Video ID required"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else "en"
    
    result = fetch_transcript(video_id, lang)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
