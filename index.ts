import WebSocket from 'ws';
import { DigestClient } from 'digest-fetch';
import { createDatabase, createTable, db, dbConfig, insertData } from './db';
import { createConnection } from 'mysql2/promise';

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

    ws.on('message', async (data: string) => {
        try {
            const jsonData: WebSocketMessage = JSON.parse(data);
            if (jsonData?.params?.notification?.topic === 'tns1:VideoSource/tnsaxis:Thermometry/TemperatureDetection') {
                const data = jsonData?.params?.notification?.message?.data
                if (data) {
                    console.log(data);
                    const tableName = data.AreaName.split(' ').join('_');
                    await createTable(tableName)
                    await insertData(tableName, {
                        min: data.MinimumTemp,
                        max: data.MaximumTemp,
                        avg: data.AverageTemp,
                    })
                }
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
}

// Main function
(async () => {
    await createDatabase()

    const sessionId = await getSessionId();
    if (sessionId) {
        console.log('Session ID:', sessionId);
        startWebSocket(sessionId);
    }
})();
