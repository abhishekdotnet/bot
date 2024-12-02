import React, { useState, useEffect } from "react";
import './App.css';

const Assistant = () => {
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);

    // Gemini API configuration
    const API_KEY = "AIzaSyDFHM6CM1TG1Ndgu2gtFNISL8l4WC1YIDA";
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

    // Variable to store the speech synthesis object
    let speechSynthesisUtterance = null;

    // Function for text-to-speech
    const speak = (text) => {
        // Stop any ongoing speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        // Create a new SpeechSynthesisUtterance object for each speech
        speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
        speechSynthesisUtterance.rate = 1;
        speechSynthesisUtterance.pitch = 1;
        speechSynthesisUtterance.volume = 1;

        // Ensure voices are loaded
        const voices = window.speechSynthesis.getVoices();
        let femaleVoice = voices.find(voice => voice.name.toLowerCase().includes("female"));

        // Use female voice or default to the first available voice
        speechSynthesisUtterance.voice = femaleVoice || voices[0];

        // Speak the text
        window.speechSynthesis.speak(speechSynthesisUtterance);
    };

    // Function for greeting based on time of day
    const wishMe = () => {
        const hours = new Date().getHours();
        if (hours < 12) {
            speak("Good Morning Sir");
        } else if (hours < 16) {
            speak("Good Afternoon Sir");
        } else {
            speak("Good Evening Sir");
        }
    };

    // Function to process the command
    const takeCommand = async (command) => {
        // Clear old messages after processing new command
        setMessages([]);

        const newMessages = [{ text: command, user: true }];
        setMessages(newMessages);

        if (command.includes("who are you")) {
            speak("I'm Rishu, developed by Abhishek.");
            newMessages.push({ text: "I'm Rishu, developed by Abhishek.", user: false });
        } else if (command.includes("hello") || command.includes("hi")) {
            speak("Hello! How can I assist you?");
            newMessages.push({ text: "Hello! How can I assist you?", user: false });
        } else if (command.includes("bye") || command.includes("goodbye")) {
            speak("Goodbye! Have a nice day.");
            newMessages.push({ text: "Goodbye! Have a nice day.", user: false });
        } else {
            // If the command doesn't match predefined ones, we call the Gemini API
            var apiResponse = await generateAPIResponse(command);
            if (apiResponse.toLowerCase().includes("google") && apiResponse.toLowerCase().includes("gemini")) {
                // If both words are found, replace them
                apiResponse = apiResponse.replace("google", "Abhishek").replace("gemini", "Rishu");
            }
            speak(apiResponse);
            newMessages.push({ text: apiResponse, user: false });
        }

        setMessages(newMessages); // Update messages
    };

    // Function to generate a response from the Gemini API
    const generateAPIResponse = async (message) => {
        const userMessage = message + " in 70 words only";
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: userMessage }]
                    }]
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message);

            const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*(.*?)\*/g, '$1');
            return apiResponse;
        } catch (error) {
            console.error(error, "Server is not responding");
            return "Sorry, I couldn't get a response from the server.";
        }
    };

    // Use speech recognition to process commands
    const startListening = () => {
        const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (speechRecognition) {
            const recognition = new speechRecognition();
            recognition.onresult = (event) => {
                const currentIndex = event.resultIndex;
                const transcript = event.results[currentIndex][0].transcript;
                setMessages(prevMessages => [...prevMessages, { text: transcript, user: true }]);
                takeCommand(transcript.toLowerCase());
            };

            recognition.onerror = () => {
                speak("Sorry, I couldn't understand that. Could you please repeat?");
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
            setIsListening(true);
        } else {
            speak("Your browser does not support speech recognition.");
        }
    };

    // Handle click event for start listening button
    const handleButtonClick = () => {
        // Stop speech if any is ongoing
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        startListening();
    };

    // Effect for greeting on page load
    useEffect(() => {
        wishMe();
    }, []);

    return (
        <div className="App">
            <img src="/logom.png" alt="Rishu Logo" id="logo" />
            <h1>I'm <span>Rishu</span>, Your Virtual Assistant</h1>

            <div className="chat-container">
                {messages.map((message, index) => (
                    <div key={index} className={`chat-bubble ${message.user ? 'user' : ''}`}>
                        {message.text}
                    </div>
                ))}
            </div>

            <img src="/voice.gif" alt="Listening" id="voice" className={isListening ? 'active' : ''} />

            <button onClick={handleButtonClick}>
                <img src="/mic.svg" alt="microphone" />
                Click here to talk
            </button>
        </div>
    );
};

export default Assistant;
