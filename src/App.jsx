import { useLayoutEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import Footer from './components/Footer'
import Header from './components/Header'
import Home from './pages/Home'
import JobDetail from './pages/JobDetail'

export default function App() {
  // 첫 페인트 흰 번쩍임 방지용 임시 배경을 뗀다 (index.html 의 booting 참고).
  // 페인트 전에 떼야 반대로 어두운 배경이 남지 않으므로 layout effect 를 쓴다.
  useLayoutEffect(() => {
    document.documentElement.classList.remove('booting')
  }, [])

  return (
    <BrowserRouter>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
