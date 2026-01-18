import React from 'react'
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const GetStart = () => {
    return (
        <>
            <section id='getstart' className="relative z-10 py-20">
                <div className="max-w-4xl mx-auto text-center px-1">
                    <motion.div
                        className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-2 md:p-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 className="text-xl md:text-3xl font-bold mb-4">
                            Start Your Journey
                        </h3>

                        <p className="text-gray-300 text-sm md:text-md mb-8 max-w-2xl mx-auto">
                            Create your secure account and access everything you need.
                            Whether you're new or returning, you're only one click from your account.
                        </p>

                        <div className="flex flex-row justify-center gap-4">
                            <Link to="/signup">
                                <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]">
                                    Create Account
                                </button>
                            </Link>

                            <Link to="/login">
                                <button className="bg-transparent border-2 border-gray-600 hover:border-gray-500 text-white font-medium px-5 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02]">
                                    Sign In
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    )
}

export default GetStart
