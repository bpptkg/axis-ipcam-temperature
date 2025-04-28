import WebSocket from 'ws';
import { DigestClient } from 'digest-fetch';
import axios from 'axios';

// Camera credentials
const CAMERA_IP = process.env.CAMERA_IP;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const STATION_CODE = process.env.STATION_CODE;
const TEMPERATURE_FILTER_KEY = 'tns1:VideoSource/tnsaxis:Thermometry/TemperatureDetection'
const DEVIATION_FILTER_KEY = 'tns1:VideoSource/RadiometryAlarm/tnsaxis:DeviationDetection'

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

const waitTenSeconds = async () => new Promise(resolve => setTimeout(resolve, 10000));

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
                        topicFilter: TEMPERATURE_FILTER_KEY
                    },
                    {
                        topicFilter: DEVIATION_FILTER_KEY
                    }
                ]
            }
        }));
    });

    ws.on('message', async (e: string) => {
        try {
            const jsonData: WebSocketMessage = JSON.parse(e);
            const topic = jsonData?.params?.notification?.topic
            const data = jsonData?.params?.notification?.message?.data
            console.log(topic);


            if (!data || !process.env.CALLBACK_URL) {
                return
            }

            if (topic === TEMPERATURE_FILTER_KEY) {
                await axios.post(process.env.CALLBACK_URL, { ...data, StationCode: STATION_CODE }, {
                    headers: {
                        'Authorization': `Basic ${btoa(`${process.env.AUTH_USERNAME}:${process.env.AUTH_PASSWORD}`)}`,
                        'Content-Type': 'application/json',
                    }
                });
                console.log('Temperature data sent to webhook: ', new Date().toISOString());

            } else if (topic === DEVIATION_FILTER_KEY) {
                await axios.post(`${process.env.CALLBACK_URL}/deviation`, { ...data, StationCode: STATION_CODE }, {
                    headers: {
                        'Authorization': `Basic ${btoa(`${process.env.AUTH_USERNAME}:${process.env.AUTH_PASSWORD}`)}`,
                        'Content-Type': 'application/json',
                    }
                });
                console.log('Deviation data sent to webhook: ', new Date().toISOString());
            }
        } catch (error) {
            console.error('Failed to parsing JSON or send data:', error.response?.data || error);
            ws.terminate()
        }
    });

    ws.on('error', async (error) => {
        console.error('WebSocket Error:', error);
        ws.terminate()
    });

    ws.on('close', async () => {
        console.log('WebSocket connection closed');
        ws.removeAllListeners()
        ws.terminate()

        await waitTenSeconds()
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
