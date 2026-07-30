import About from '../components/About'
import Contact from '../components/Contact'
import Culture from '../components/Culture'
import Domains from '../components/Domains'
import Hero from '../components/Hero'
import Jobs from '../components/Jobs'
import Pipeline from '../components/Pipeline'
import Projects from '../components/Projects'

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Domains />
      <Pipeline />
      <Projects />
      <Jobs />
      <Culture />
      <Contact />
    </>
  )
}
