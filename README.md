# CallSense 

**AI-Powered Customer Call Analysis Tool**

---

##  Problem Statement

Customer support teams struggle to identify recurring issues from large volumes of call recordings, leading to:

- **Reactive problem-solving** instead of proactive issue prevention
- **Time-consuming manual analysis** of customer complaints  
- **Missed patterns** in customer feedback that could improve products/services
- **Inability to prioritize** which problems need immediate attention

CallSense solves this by automatically analyzing support call recordings to extract and rank the most common customer problems, enabling businesses to address systemic issues quickly and reduce future complaint volume.

---

##  How It Works

1. **Audio Upload** - Users upload customer call recordings (`.mp3`, `.wav`, `.m4a`)
2. **Speech-to-Text Conversion** - Cloud API transcribes audio to text with high accuracy
3. **AI Problem Analysis** - Natural language processing identifies customer issues and complaints
4. **Problem Ranking** - System ranks and displays top 5-10 recurring problems with frequency scores
5. **Actionable Insights** - Teams get clear visibility into what customers are struggling with most

**Workflow:**
Audio File → Speech API → Text Transcript → AI Analysis → Ranked Problem List


---

## 🛠️ Tech Stack Used

### Backend:
- **NODE.JS** (Flask)
- **Llama** (audio processing)

### APIs & AI:
- **Whisper** (audio transcription)

### Frontend:
- **React**
- **ShadCN** (responsive design)

---

## Setup Instructions

### Prerequisites
- Whisper AI Key

### Installation Steps

1. **Clone the repository**
git clone https://github.com/ZalaJi07/codewave1.0-drachenblut.git
cd codewave1.0-drachenblut.git

2. **Install Node Modules**
npm install

3. **Run the Application**
npm run dev

4. **Access the web interface**
Open browser and go to: http://localhost:3000

### Testing the Setup
1. Upload a sample audio file (`.mp3` or `.wav`)
2. Wait for processing
3. View the ranked list of problems identified

---

## 👥 Team Members

- **Harshrajsinh Gohil** - Frontend Development & UI/UX
- **Mann Dalsaniya** - Backend Development & AI Integration
- **Harashdeepsinh Zala** - Audio Processing & API Integration

---
