# Thermal Camera Data Acquisition for BPPTKG

This project provides a cloud-based data acquisition service for collecting thermal camera data from an IP camera in the BPPTKG network. Since a direct connection to the IP camera is not possible, data is acquired in the cloud and sent to a webhook in the BPPTKG network.

## Features

- Connects to an Axis camera via WebSocket
- Uses Digest Authentication to obtain a session ID
- Subscribes to temperature detection events
- Sends acquired data to a webhook

## Requirements

- Node.js (v16+ recommended)
- A publicly accessible webhook endpoint to receive data

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/bpptkg-thermal-acquisition.git
   cd bpptkg-thermal-acquisition
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file and add the following:

   ```env
   CAMERA_IP=your_camera_ip
   USERNAME=your_camera_username
   PASSWORD=your_camera_password
   CALLBACK_URL=https://your-webhook-endpoint.com
   ```

4. Run the application:
   ```sh
   npm start
   ```

## How It Works

- The application fetches a session ID using Digest Authentication.
- A WebSocket connection is established with the Axis camera.
- Temperature detection events are received and forwarded to the webhook endpoint.

## Webhook Payload

The application sends data to the webhook in the following format:

```json
{
  "TemperatureUnit": "Celsius",
  "MaxTempPositionX": "100",
  "MaximumTemp": "75.2",
  "MinTempPositionY": "50",
  "AverageTemp": "70.5",
  "MinTempPositionX": "120",
  "MaxTempPositionY": "60",
  "AreaName": "Merapi_Site_1",
  "MinimumTemp": "68.1"
}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature/fix.
3. Make your changes and commit them.
4. Open a pull request.

## License

This project is licensed under the MIT License.
