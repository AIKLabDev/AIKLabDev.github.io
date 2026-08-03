import About from '../components/About'
import Contact from '../components/Contact'
import Culture from '../components/Culture'
import Hero from '../components/Hero'
import Jobs from '../components/Jobs'
import Pipeline from '../components/Pipeline'
import Projects from '../components/Projects'
import TechAreas from '../components/TechAreas'

export default function Home() {
  return (
    <>
      <Hero />
      <TechAreas />
      <Projects />
      <Pipeline />
      <Jobs />
      <Culture />
      <Contact />
    </>
  )
}
