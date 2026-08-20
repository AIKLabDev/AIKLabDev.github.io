import Contact from '../components/Contact'
// import Culture from '../components/Culture'
import Jobs from '../components/Jobs'
import Pipeline from '../components/Pipeline'
import Projects from '../components/Projects'
import ScrollScene from '../components/scroll-scene/ScrollScene'
import TechAreas from '../components/TechAreas'

export default function Home() {
  return (
    <>
      <ScrollScene />
      <TechAreas />
      <Projects />
      <Pipeline />
      <Jobs />
{/*       <Culture /> */}
      <Contact />
    </>
  )
}
