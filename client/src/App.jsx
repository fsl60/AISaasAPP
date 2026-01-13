import Layout from './pages/Layout'
import React from 'react'
import Home from './pages/Home'
import { Routes,Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import WriteArticles from './pages/WriteArticles'
import BlogTitles from './pages/BlogTitles'
import GenerateImages from './pages/GenerateImages'
import RemoveBackground from './pages/RemoveBackground'
import RemoveObjects from './pages/RemoveObjects'
import ReviewResume from './pages/ReviewResume'
import Community from './pages/Community'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import {Toaster} from 'react-hot-toast'


const App = () => {
  
  return (
    <div>
      <Toaster/>
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/ai' element={<Layout></Layout>}>
        <Route index element={<Dashboard/>}/>
        <Route path='write-article' element={<WriteArticles/>}/>
        <Route path='blog-titles' element={<BlogTitles/>}/>
        <Route path='generate-images' element={<GenerateImages/>}/>
        <Route path='remove-background' element={<RemoveBackground/>}/>
        <Route path='remove-object' element={<RemoveObjects/>}/>
        <Route path='review-resume' element={<ReviewResume/>}/>
        <Route path='community' element={<Community/>}/>


        </Route>
      </Routes>
    </div>
  )
}

export default App
