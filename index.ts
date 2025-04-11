import WebSocket from 'ws';
import { DigestClient } from 'digest-fetch';
import axios from 'axios';

// Camera credentials
const CAMERA_IP = process.env.CAMERA_IP;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

interface WebSocketMessage {
    params?: {
        notification?: {
            topic?: string;
            message?: {
                data: {
                    TemperatureUnit: string
                    MaxTempPositionX: string
                    MaximumTemp: string
                    MinTempPositionY: string
                    AverageTemp: string
                    MinTempPositionX: string
                    MaxTempPositionY: string
                    AreaName: string
                    MinimumTemp: string
                }
            };
        };
    };
}

// Function to get the session ID using Digest Authentication
async function getSessionId(): Promise<string | null> {
    try {
        const client = new DigestClient(USERNAME, PASSWORD);
        const res = await client.fetch(`http://${CAMERA_IP}/axis-cgi/wssession.cgi`, {
            method: "GET",
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error('Failed to get session ID:', error);
        return null;
    }
}

// Function to start WebSocket connection
async function startWebSocket(sessionId: string): Promise<void> {
    if (!sessionId) {
        console.error('No session ID, cannot start WebSocket');
        return;
    }

    const ws = new WebSocket(`ws://${CAMERA_IP}/vapix/ws-data-stream?wssession=${sessionId}&sources=events`, {
        rejectUnauthorized: false
    });

    ws.on('open', () => {
        console.log('Connected to Axis WebSocket API');

        // Subscribe to temperature detection events
        ws.send(JSON.stringify({
            apiVersion: "1.0",
            method: "events:configure",
            params: {
                eventFilterList: [
                    {
                        topicFilter: "tns1:VideoSource/tnsaxis:Thermometry/TemperatureDetection"
                    }
                ]
            }
        }));
    });

    ws.on('message', async (e: string) => {
        try {
            const jsonData: WebSocketMessage = JSON.parse(e);
            if (jsonData?.params?.notification?.topic === 'tns1:VideoSource/tnsaxis:Thermometry/TemperatureDetection') {
                const data = jsonData?.params?.notification?.message?.data
                if (data) {
                    if (process.env.CALLBACK_URL) {
                        await axios.post(process.env.CALLBACK_URL, data, {
                            headers: {
                                'Authorization': `Basic ${btoa(`${process.env.AUTH_USERNAME}:${process.env.AUTH_PASSWORD}`)}`,
                                'Content-Type': 'application/json',
                            }
                        });
                        console.log('Data sent to webhook');
                    }
                }
            }
        } catch (error) {
            ws.removeAllListeners()
            const sessionId = await getSessionId();
            if (sessionId) {
                console.log('New Session ID:', sessionId);
                startWebSocket(sessionId);
            }
            console.error('Failed to parsing JSON or send data:', error);
        }
    });

    ws.on('error', async (error) => {
        console.error('WebSocket Error:', error);

        ws.removeAllListeners()
        const sessionId = await getSessionId();
        if (sessionId) {
            console.log('New Session ID:', sessionId);
            startWebSocket(sessionId);
        }
    });

    ws.on('close', async () => {
        console.log('WebSocket connection closed');

        ws.removeAllListeners()
        const sessionId = await getSessionId();
        if (sessionId) {
            console.log('New Session ID:', sessionId);
            startWebSocket(sessionId);
        }
    });
}

// Main function
(async () => {
    const sessionId = await getSessionId();
    if (sessionId) {
        console.log('Session ID:', sessionId);
        startWebSocket(sessionId);
    }
})();
