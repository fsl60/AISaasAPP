import { useAuth, useUser } from '@clerk/clerk-react'
import React, { useEffect, useState } from 'react'
import { dummyPublishedCreationData } from '../assets/assets'
import { Heart } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'


axios.defaults.baseURL=import.meta.env.VITE_BASE_URL;


const Community = () => {
  const [creations, setCreations] = useState([])
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const {getToken} =useAuth()

  const fetchCreations = async () => {
    try{
      const {data} =await axios.get('/api/user/get-published-creations',{
        headers : {Authorization: `Bearer ${await getToken()}`}
      })
      if (data.success){
        setCreations(data.creations)
      }
      else{
        toast.error(data.message)
      }

    }
    catch (error){
      toast.error(error.message)

    }
    setLoading(false)
  }

  const imageLikeToggle = async (id) => {
  // Optimistic update
  setCreations(prev =>
    prev.map(c => {
      if (c.id !== id) return c

      const likes = c.likes ?? []
      const hasLiked = likes.includes(user.id)

      return {
        ...c,
        likes: hasLiked
          ? likes.filter(uid => uid !== user.id)
          : [...likes, user.id]
      }
    })
  )

  try {
    await axios.post(
      '/api/user/toggle-like-creations',
      { id },
      { headers: { Authorization: `Bearer ${await getToken()}` } }
    )
  } catch (err) {
    // rollback on failure
    setCreations(prev =>
      prev.map(c => {
        if (c.id !== id) return c
        const likes = c.likes ?? []
        return {
          ...c,
          likes: likes.includes(user.id)
            ? likes.filter(uid => uid !== user.id)
            : [...likes, user.id]
        }
      })
    )
    toast.error("Failed to update like")
  }
}


  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <h2>Creations</h2>

      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3'>
        {creations.map((creation) => {
          const likes = creation.likes ?? []

          return (
            <div key={creation.id} className='relative group'>
              <img
                src={creation.content}
                alt=''
                className='w-full h-full object-cover rounded-lg'
              />

              <div className='absolute inset-0 flex items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg'>
                <p className='text-sm hidden group-hover:block'>
                  {creation.prompt}
                </p>

                <div className='flex gap-1 items-center'>
                  <p>{likes.length}</p>
                  <Heart onClick={()=> imageLikeToggle(creation.id)}
                    className={`min-w-5 h-5 cursor-pointer hover:scale-110 ${
                      likes.includes(user?.id)
                        ? 'fill-red-500 text-red-600'
                        : 'text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Community
