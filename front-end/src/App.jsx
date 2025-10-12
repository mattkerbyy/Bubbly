import { BrowserRouter as Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-primary">
            Welcome to Bubbly
          </h1>
          <p className="text-center text-muted-foreground mt-4">
            Full-Stack Social Media Platform
          </p>
        </div>
      </div>
    </Router>
  )
}

export default App
