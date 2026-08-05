import About from '../components/About'
import Contact from '../components/Contact'
import Culture from '../components/Culture'
import Jobs from '../components/Jobs'
import Pipeline from '../components/Pipeline'
import Projects from '../components/Projects'
import ScrollScene from '../components/scroll-scene/ScrollScene'
import TechAreas from '../components/TechAreas'

export default function Home() {
  return (
    <>
      {/* 스크롤 연동 3D 히어로 — WebGL 미지원·모션 저감 시 내부에서 정적 Hero 로 폴백한다 */}
      <ScrollScene />
      <TechAreas />
      <Projects />
      <Pipeline />
      <Jobs />
      <Culture />
      <Contact />
    </>
  )
}
