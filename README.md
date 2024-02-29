# Trello copy

## Setup

```sh
# Install dependencies
npm install

# Run database
docker compose up -d

# Create .env file and fill with the values
cp .env.example .env

# Start in development mode
npm run start:dev

# Or, prepare for run the dist version.

# Run typescript
npm run build

# Run service
npm start
```
