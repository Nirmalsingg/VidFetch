FROM node:20-bookworm

# Install Python, FFmpeg and other required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --break-system-packages -U yt-dlp

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# Create application directory
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend ./backend

# Create downloads directory
RUN mkdir -p /app/backend/downloads

WORKDIR /app/backend

# Render provides the PORT environment variable
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]