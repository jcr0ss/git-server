# Git HTTP Server

A lightweight HTTP server for hosting Git repositories. This server enables Git operations (clone, pull, push) over HTTP.

## Setup

1. Install dependencies:
```
npm install
```

2. Configure the server by modifying the `.env` file:
```
REPO_DIR=D:/GitServer    # Change to your desired repository directory path
PORT=6969                # Change to your desired port number
```

## Running the Server

Start the server with:
```
node server.js
```

The server will start and display the configured port and repository directory.

## Setting Up Git Repositories

1. Create your Git repository directory (if it doesn't exist yet):
```
mkdir D:/GitServer
```

2. Create a bare Git repository for each project:
```
cd D:/GitServer
git init --bare my-project.git
```

3. Alternatively, you can create a bare repository from an existing local repository:
```
cd /path/to/your/existing/repo
git clone --bare . D:/GitServer/my-project.git
```

> Note: Each repository must be a bare Git repository (ending with `.git`). If a repository name doesn't end with `.git`, the server will automatically append it.

## Configuring Git Clients

To use this server from Git clients, you'll need to configure the remote URL to point to your server.

### Adding a Remote

```
git remote add origin http://YOUR_LOCAL_IP:PORT/REPO_NAME
```

Example:
```
git remote add origin http://192.168.86.59:6969/my-project
```

> Note: Replace `192.168.86.59` with your computer's local IP address and `6969` with your configured port.

### Finding Your Local IP

#### Windows
```
ipconfig
```
Look for the IPv4 Address under your active network adapter.

#### Mac/Linux
```
ifconfig
```
or
```
ip addr
```

## Troubleshooting

- Make sure your firewall allows connections on the configured port
- Ensure Git is installed and available in your system PATH
- If you change the configuration in the `.env` file, you need to restart the server

## Security Note

This is a basic Git HTTP server intended for local or internal network use. It does not include authentication or encryption features required for public-facing servers.
