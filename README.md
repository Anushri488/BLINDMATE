# 👁️ BlindMate – AI Navigation Assistant

BlindMate is a web-based assistive navigation app for visually impaired users. It uses the device camera, TensorFlow.js object detection and browser text-to-speech to identify nearby objects and speak useful navigation alerts.

## 🔗 Live Demo

https://blindmate-app-1.onrender.com/

## ✨ Features

- Real-time object detection using the device camera
- Voice alerts with object name, direction and estimated distance
- Risk level detection based on object size in the camera frame
- Live bounding boxes on detected objects
- Recent detection history with confidence score
- Adjustable detection sensitivity and voice volume
- Accessible, responsive UI built for mobile and desktop browsers

## 🧠 How It Works

1. The browser asks for camera permission.
2. TensorFlow.js loads the COCO-SSD object detection model.
3. Every few milliseconds, the app scans the camera frame.
4. Detected objects are filtered using the selected confidence threshold.
5. The app estimates direction and distance using the object's bounding box.
6. The highest-priority object is spoken using browser Text-to-Speech.

## 🛠️ Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- TensorFlow.js
- COCO-SSD model
- Web Speech API
- MediaDevices Camera API

## 📦 Installation

```bash
npm install
npm run dev
```

## 🚀 Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```text
BlindMate/
├── App.tsx              # Main application logic and UI
├── index.html           # Root HTML file
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind configuration
├── vite.config.ts       # Vite configuration
└── README.md            # Project documentation
```

## 🎯 Use Cases

- Assistive navigation prototype
- Accessibility-focused AI project
- Computer vision learning project
- Real-time browser-based object detection demo

## ⚠️ Note

BlindMate is an academic/prototype project. It should not be used as the only safety tool for real-world navigation.
