import { useLayoutEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import Footer from './components/Footer'
import Header from './components/Header'
import Home from './pages/Home'
import JobDetail from './pages/JobDetail'

export default function App() {
  /**
   * 흰 번쩍임 방지용 임시 배경(index.html 의 booting) 관리.
   *
   * 마운트 시 뗀다 — 페인트 전에 떼야 반대로 어두운 배경이 남지 않는다.
   *
   * 떠날 때 다시 붙이는 것이 핵심이다. html 에 배경이 없어 브라우저는 base
   * background 를 body(밝은 색)에서 가져가는데, 페이지가 헐리면서 우리 레이어가
   * 사라지면 그 밝은 base 가 드러나 흰 화면이 번쩍인다. 새로고침 때 보이던
   * "가운데가 흰 방사형" 이 그것이다 — 남아 있던 그라데이션 레이어가 밝은 base
   * 위에 겹친 모습이었다.
   *
   * pagehide 를 쓴다. beforeunload 는 리스너를 다는 것만으로 bfcache 를 막는다.
   */
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.remove('booting')

    const dim = () => root.classList.add('booting')
    window.addEventListener('pagehide', dim)
    return () => window.removeEventListener('pagehide', dim)
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
