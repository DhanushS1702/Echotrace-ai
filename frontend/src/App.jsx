import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home     from './pages/Home'
import Analysis from './pages/Analysis'
import Reports  from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"         element={<Home />}     />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/reports"  element={<Reports />}  />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
