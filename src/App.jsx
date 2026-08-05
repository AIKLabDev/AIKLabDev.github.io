import { BrowserRouter, Route, Routes } from 'react-router'
import Footer from './components/Footer'
import HashScroll from './components/HashScroll'
import Header from './components/Header'
import Home from './pages/Home'
import JobDetail from './pages/JobDetail'
import JobList from './pages/JobList'

export default function App() {
  return (
    <BrowserRouter>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <HashScroll />
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
