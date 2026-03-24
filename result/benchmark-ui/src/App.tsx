import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import PlanV1Page from './pages/PlanV1Page'
import PlanV2Page from './pages/PlanV2Page'
import ResultsHome from './pages/ResultsHome'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ResultsHome />} />
          <Route path="plan-v1" element={<PlanV1Page />} />
          <Route path="plan-v2" element={<PlanV2Page />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
