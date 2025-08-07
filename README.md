# CallSense 🔍

**AI-Powered Customer Call Analysis Tool**

---

## 📋 Problem Statement

Customer support teams struggle to identify recurring issues from large volumes of call recordings, leading to:

- **Reactive problem-solving** instead of proactive issue prevention
- **Time-consuming manual analysis** of customer complaints  
- **Missed patterns** in customer feedback that could improve products/services
- **Inability to prioritize** which problems need immediate attention

CallSense solves this by automatically analyzing support call recordings to extract and rank the most common customer problems, enabling businesses to address systemic issues quickly and reduce future complaint volume.

---

## 🔧 How It Works

1. **🎤 Audio Upload** - Users upload customer call recordings (`.mp3`, `.wav`, `.m4a`)
2. **📝 Speech-to-Text Conversion** - Cloud API transcribes audio to text with high accuracy
3. **🤖 AI Problem Analysis** - Natural language processing identifies customer issues and complaints
4. **📊 Problem Ranking** - System ranks and displays top 5-10 recurring problems with frequency scores
5. **📈 Actionable Insights** - Teams get clear visibility into what customers are struggling with most

**Workflow:**
Audio File → Speech API → Text Transcript → AI Analysis → Ranked Problem List

text

---

## 🛠️ Tech Stack Used

### Backend:
- **Python** (Flask)
- **pandas, librosa, soundfile** (audio processing)

### APIs & AI:
- **Google Speech-to-Text API** (audio transcription)
- **OpenAI GPT API** (problem extraction and analysis)

### Frontend:
- **HTML/CSS/JavaScript**
- **Bootstrap** (responsive design)

### Development:
- **Git** (version control)
- **Requirements.txt** (dependency management)

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Google Cloud account (for Speech API)
- OpenAI account (for GPT API)

### Installation Steps

1. **Clone the repository**
git clone https://github.com/[your-username]/callsense.git
cd callsense

text

2. **Create virtual environment**
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

text

3. **Install dependencies**
pip install -r requirements.txt

text

4. **Set up API keys**
cp .env.example .env

text
Edit `.env` file and add:
WISHPER_AI=your_wishper_ai_api_key

text

5. **Run the application**
python app.py

text

6. **Access the web interface**
Open browser and go to: http://localhost:5000

text

### Testing the Setup
1. Upload a sample audio file (`.mp3` or `.wav`)
2. Wait for processing (typically 10-30 seconds)
3. View the ranked list of problems identified

---

## 👥 Team Members

- **Harshrajsinh Gohil** - Frontend Development & UI/UX  
- **Mann Dalsaniya** - Backend Development & AI Integration
- **Harashdeepsinh Zala** - Audio Processing & API Integration

---
