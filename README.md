# Axis Camera Temperature Data Acquisition

This project provides a Node.js application for acquiring temperature data from an Axis camera using WebSockets and Digest Authentication.

## Features

- Connects to an Axis camera via WebSocket
- Uses Digest Authentication to obtain a session ID
- Subscribes to temperature detection events
- Stores temperature data in a database dynamically

## Requirements

- Node.js (v16+ recommended)
- An Axis camera with WebSocket and temperature detection support
- Database setup (configured in `db.ts`)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/bpptkg/axis-ipcam-temperature.git
   cd axis-ipcam-temperature
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
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_DB_NAME=axis_ip_camera_temperature
   MYSQL_PASSWORD="password"
   ```

4. Run the application:
   ```sh
   npm start
   ```

## How It Works

- The application fetches a session ID using Digest Authentication.
- A WebSocket connection is established with the Axis camera.
- Temperature detection events are received and stored dynamically in the database.
- Each monitored area gets its own table in the database.

## Database Structure

Each table is created dynamically based on the `AreaName` in the received event data. The stored fields include:

- `min` - Minimum detected temperature
- `max` - Maximum detected temperature
- `avg` - Average temperature

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature/fix.
3. Make your changes and commit them.
4. Open a pull request.

## License

This project is licensed under the MIT License.
