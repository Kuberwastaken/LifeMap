# Personal Mind Map

A web application for creating personal mind maps. Start with your name in the center and branch out to explore different aspects of your life.

## Features

- Minimalist dark theme with stars background
- Interactive mind map structure
- Direct node connections
- Save and load functionality
- Zoom and pan controls

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone this repository or create a new React project and copy the files:

```bash
# Either clone the repo
git clone https://github.com/yourusername/personal-mind-map.git

# Or create a new React app
npx create-react-app personal-mind-map
# Then copy the files from this repository
```

2. Navigate to the project directory:

```bash
cd personal-mind-map
```

3. Install the dependencies:

```bash
npm install
# or
yarn install
```

4. Start the development server:

```bash
npm start
# or
yarn start
```

The app will be available at http://localhost:3000.

## Deploying to GitHub Pages

1. Update the `homepage` field in `package.json` with your GitHub username:

```json
"homepage": "https://yourusername.github.io/personal-mind-map"
```

2. Install the `gh-pages` package if not included:

```bash
npm install --save-dev gh-pages
# or
yarn add --dev gh-pages
```

3. Make sure the deploy scripts are in `package.json`: