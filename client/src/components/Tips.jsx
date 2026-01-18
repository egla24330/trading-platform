import React from 'react'

export default function Tips() {
    return (
        <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Upload Tips and Requirements
                </h4>
                <ul className="text-gray-500 text-xs space-y-1">
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Both front and back of your ID are required</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Ensure all four corners of your ID are visible</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Document must be valid and not expired</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>File size under 5MB each and JPG, PNG formats accepted</span>
                    </li>

                </ul>
            </div>

        </>
    )
}
