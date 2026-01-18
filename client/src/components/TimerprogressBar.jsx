import React from 'react'
import { motion } from 'framer-motion'
const TimerprogressBar = ({timer,verificationStatus}) => {
    return (
        <div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
                <motion.div
                    className={`${verificationStatus === 'error' ? 'bg-red-500': 'bg-blue-500'} h-1.5 rounded-full`}
                    initial={{ width: "100%" }}
                    animate={{ width: `${(timer / 60) * 100}%` }}
                    transition={{ duration: 1 }}
                />
            </div>
        </div>
    )
}

export default TimerprogressBar
