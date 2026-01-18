import React from 'react'
import { useNavigate } from 'react-router-dom'
const NotificationCenter = () => {
    const navigate = useNavigate()
  return (
    <div className='flex justify-center mt-40 gap-2'>
      <div
      className='font-serif text-sm text-blue-500 border rounded p-2 '
      >Coming soon
      </div>

      <div
      onClick={()=>navigate('/')} 
      className='font-serif text-sm text-blue-500 border rounded p-2 cursor-pointer '>
        back to home?
      </div>
    </div>
  )
}

export default NotificationCenter
