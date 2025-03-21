# Cargo Stowage Management System

A comprehensive application for optimizing cargo stowage within containers, featuring 3D visualization, intelligent item placement, and complete management of containers and items.

## Features

- **Container Management**: Create, view, edit, and delete containers
- **Item Management**: Track items with properties like dimensions, weight, fragility, etc.
- **Stowage Optimization**: Automatically generate optimal stowage plans
- **3D Visualization**: See how items are placed within containers
- **Light/Dark Mode**: Toggle between light and dark themes

## Project Structure

```
cargo-stowage-system/
├── backend/                      # Backend API services
│   ├── app/                      # Main application code
│   │   ├── api/                  # API endpoints
│   │   ├── core/                 # Core functionality
│   │   ├── db/                   # Database connections
│   │   └── models/               # Data models
│   └── Dockerfile                # Docker configuration
├── frontend/                     # React frontend application
│   ├── public/                   # Static files
│   ├── src/                      # Source code
│   │   ├── 3d/                   # 3D visualization components
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Application pages
│   │   ├── store/                # Redux store and slices
│   │   └── styles/               # CSS and styling
│   └── Dockerfile                # Docker configuration
└── docker-compose.yml            # Multi-container Docker configuration
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/soumomo/cargo-stowage-system.git
   cd cargo-stowage-system
   ```

2. Install dependencies
   ```bash
   cd frontend
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## Deployment to GitHub Pages

1. Update the `homepage` field in `frontend/package.json` to match your GitHub username:
   ```json
   "homepage": "https://soumomo.github.io/cargo-stowage-system"
   ```

2. Install the `gh-pages` package if you haven't already:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Deploy the application:
   ```bash
   npm run deploy
   ```

4. The application will be available at `https://soumomo.github.io/cargo-stowage-system`

## Setting Up Your GitHub Repository

1. Create a new repository on GitHub named "cargo-stowage-system"

2. Initialize git in your project folder if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. Add the GitHub repository as a remote:
   ```bash
   git remote add origin https://github.com/soumomo/cargo-stowage-system.git
   ```

4. Push your code to GitHub:
   ```bash
   git push -u origin main
   ```
   (Use `master` instead of `main` if your default branch is still called `master`)

5. Now you can run `npm run deploy` from the frontend directory to deploy to GitHub Pages

## Notes for Deployment

- Make sure to update the React Router to use `basename={process.env.PUBLIC_URL}` for GitHub Pages:

```jsx
// In src/index.tsx or App.tsx where you define your Router
<BrowserRouter basename={process.env.PUBLIC_URL}>
  {/* Your routes */}
</BrowserRouter>
```

- You might need to add a `404.html` to handle client-side routing on GitHub Pages 