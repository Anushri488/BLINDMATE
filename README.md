URL https://blindmate-app-1.onrender.com/
# 👁️‍🗨️ BlindMate – Smart Navigation Assistant for the Visually Impaired

BlindMate is an Android-based assistive navigation application designed to help visually impaired users safely navigate their surroundings using real-time camera input, object detection, and audio feedback. The app converts visual information into spoken guidance, enabling independent and confident mobility.

---

## 🚀 Project Overview

**BlindMate** leverages computer vision and artificial intelligence to:
- Detect obstacles in real time
- Identify common objects
- Provide instant audio alerts
- Enhance outdoor and indoor navigation safety

This project was developed as a capstone / academic innovation project focusing on accessibility, safety, and inclusive technology.

---

## 🛠️ Key Features

- ✅ Real-time object detection using mobile camera
- ✅ Voice-based audio alerts for nearby obstacles
- ✅ Assistance for indoor and outdoor navigation
- ✅ Simple and accessible user interface
- ✅ Works without complex user interactions
- ✅ Designed specifically for visually impaired users

---

## 🧱 System Architecture

- **Frontend**: Android Application (Java/Kotlin)
- **Backend / Processing**: On-device AI / ML model
- **Computer Vision**: Object detection using pre-trained models
- **Audio Output**: Text-to-Speech (TTS) engine

---

## 📲 Technology Stack

- Android Studio
- Java / Kotlin
- OpenCV / ML Kit / TensorFlow Lite
- Text-to-Speech (TTS)
- CameraX API
- XML for UI Design

---

## 📂 Project Structure

```plaintext
BlindMate/
│
├── app/
│   ├── activities/
│   ├── camera/
│   ├── detection/
│   ├── audio/
│   └── ui/
│
├── models/              # Trained object detection models
├── assets/              # Audio and configuration files
├── AndroidManifest.xml
└── build.gradle
