const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// ElevenLabs Scribe API for transcription
async function transcribeAudio(filePath, language = 'auto') {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      // Mock transcription for demo
      return {
        transcript: "Customer called about payment processing issues. They mentioned problems with credit card transactions failing repeatedly. The customer expressed frustration with the current system and requested immediate assistance. Multiple attempts to resolve the issue were discussed during the call.",
        confidence: 0.89
      };
    }

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(filePath));
    formData.append('language', language);

    const response = await axios.post('https://api.elevenlabs.io/v1/scribe', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.ELEVENLABS_API_KEY}`,
        ...formData.getHeaders()
      },
      timeout: 300000 // 5 minutes timeout
    });

    return {
      transcript: response.data.transcript,
      confidence: response.data.confidence || 0.85
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
}

// Google Gemini API for problem analysis
async function analyzeProblems(transcript) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Mock analysis for demo
      return {
        problems: [
          {
            problem: "Payment Processing Failure",
            confidence: 0.92,
            frequency: 1,
            category: "Billing",
            severity: "high",
            examples: ["credit card transactions failing", "payment not going through"],
            keywords: ["payment", "credit card", "transaction", "failing"]
          },
          {
            problem: "Poor User Experience",
            confidence: 0.78,
            frequency: 1,
            category: "User Experience",
            severity: "medium",
            examples: ["frustration with current system"],
            keywords: ["frustration", "system", "experience"]
          },
          {
            problem: "System Reliability Issues",
            confidence: 0.65,
            frequency: 1,
            category: "Technical",
            severity: "medium",
            examples: ["multiple attempts needed", "repeated failures"],
            keywords: ["multiple attempts", "repeated", "failures"]
          }
        ],
        analytics: {
          sentimentScore: -0.4,
          emotionAnalysis: {
            dominant: "frustrated",
            confidence: 0.82
          },
          speakerCount: 2,
          callType: "inbound"
        }
      };
    }

    const prompt = `
Analyze the following customer support call transcript and extract the top problems mentioned. 
For each problem, provide:
1. A clear, concise problem statement
2. Confidence score (0-1)
3. Frequency/severity
4. Category (Technical, Billing, Authentication, User Experience, Feature Request, Security, Performance, Other)
5. Keywords and examples from the transcript
6. Severity level (low, medium, high, critical)

Also analyze the overall sentiment and emotion of the call.

Transcript: "${transcript}"

Return a JSON response with the structure:
{
  "problems": [
    {
      "problem": "string",
      "confidence": number,
      "frequency": number,
      "category": "string",
      "severity": "string",
      "examples": ["string"],
      "keywords": ["string"]
    }
  ],
  "analytics": {
    "sentimentScore": number,
    "emotionAnalysis": {
      "dominant": "string",
      "confidence": number
    },
    "speakerCount": number,
    "callType": "string"
  }
}
`;

    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, {
      timeout: 60000 // 1 minute timeout
    });

    const generatedText = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format from Gemini API');
  } catch (error) {
    console.error('Problem analysis error:', error);
    throw new Error('Failed to analyze problems: ' + error.message);
  }
}

// Cortical.io for keyword extraction (fallback)
async function extractKeywords(text) {
  try {
    // Mock keyword extraction
    const words = text.toLowerCase().split(/\W+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said'].includes(word)
    );
    
    return [...new Set(keywords)].slice(0, 10);
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return [];
  }
}

module.exports = {
  transcribeAudio,
  analyzeProblems,
  extractKeywords
};