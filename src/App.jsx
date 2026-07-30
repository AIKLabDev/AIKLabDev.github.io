import { BrowserRouter, Routes, Route, Link } from 'react-router'

function Home() {
  return <h1 className="text-2xl font-semibold">채용 홈</h1>
}

function Jobs() {
  return <h1 className="text-2xl font-semibold">공고 목록</h1>
}

function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b p-4">
        <Link to="/">홈</Link>
        <Link to="/jobs">공고</Link>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
