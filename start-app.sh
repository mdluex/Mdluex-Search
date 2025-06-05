#!/bin/bash

# Change to the directory where the script is located
cd "$(dirname "$0")"

# Function to handle cleanup on exit
cleanup() {
    echo
    echo "Stopping all services..."
    pkill -f ollama 2>/dev/null
    pkill -f node 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

echo "Starting Mdluex Search Application..."

# Ask user if they want to create a shareable link
read -p "Do you want to create a shareable link? (y/n): " CREATE_TUNNEL
if [[ $CREATE_TUNNEL == "y" || $CREATE_TUNNEL == "Y" ]]; then
    USE_TUNNEL=1
    echo
    echo "Fetching tunnel password..."
    TUNNEL_PASSWORD=$(curl -s https://loca.lt/mytunnelpassword)
    echo "Tunnel password: $TUNNEL_PASSWORD"
    echo
    sleep 3
else
    USE_TUNNEL=0
fi

# Check if npx is available if tunnel is requested
if [ $USE_TUNNEL -eq 1 ]; then
    if ! command -v npx &> /dev/null; then
        echo "Warning: npx is not available. Shareable links will not be available."
        echo "This usually means npm is not properly installed."
        echo "Please ensure Node.js and npm are properly installed."
        echo
        USE_TUNNEL=0
    fi
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Warning: Ollama is not installed or not in PATH."
    echo "Please install Ollama from https://ollama.ai"
    echo "The application will start, but AI features will not work."
    echo
    sleep 3
fi

# Start the application
echo "Starting the application..."
npm run dev &
APP_PID=$!

# Wait for the application to start
sleep 5

# Start Localtunnel if requested
if [ $USE_TUNNEL -eq 1 ]; then
    echo "Starting Localtunnel..."
    # Start Localtunnel in the background
    npx localtunnel --port 5173 --allow-invalid-cert --subdomain mdluex-search &
    TUNNEL_PID=$!
    
    # Wait a moment for the URL to be generated
    sleep 2
fi

# Open the browser (platform specific)
case "$(uname -s)" in
    Linux*)     xdg-open http://localhost:5173 ;;
    Darwin*)    open http://localhost:5173 ;;
    *)          echo "Please open http://localhost:5173 in your browser" ;;
esac

echo
echo "Mdluex Search is now running!"
echo "- Ollama is running at http://localhost:11434"
echo "- Application is running at http://localhost:5173"
if [ $USE_TUNNEL -eq 1 ]; then
    echo "- Localtunnel is running at: https://mdluex-search.loca.lt"
    echo "- Tunnel password: $TUNNEL_PASSWORD"
fi
echo
echo "Press Ctrl+C to stop all services"
echo

# Keep the script running and handle cleanup
while true; do
    sleep 1
done 