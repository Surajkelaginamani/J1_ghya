import React from 'react'
import { useNavigate } from 'react-router-dom'
const Section1 = () => {
  const navigate = useNavigate();
  return (
    <div>
       <div className="h-full bg-[#FFFBF5] mt-0 font-sans text-gray-900">
      {/* ================= Navbar ================= */}

      {/* ================= Hero Section ================= */}
      <main className="flex flex-col items-center justify-center mt-16 px-4 text-center w-full max-w-4xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold leading-tight text-black">
          Daily Tiffin Service & <br />
          <span className="text-[#EA580C]">Homemade Food</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-lg text-slate-500 max-w-2xl">
          Connect with local tiffin services and discover authentic homemade food
          products
        </p>

        {/* Search Component */}
        <div className="mt-10 bg-white p-2 rounded-xl shadow-lg shadow-gray-200/50 w-full max-w-2xl flex items-center">
          {/* Input Wrapper */}
          <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-lg px-4 py-3">
            {/* Location Icon */}
            <svg
              className="text-gray-400 w-5 h-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            
            <input
              type="text"
              placeholder="Enter your location"
              className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Search Button */}
          <button className="ml-2 bg-[#EA580C] hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition">
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Find Tiffin
          </button>
        </div>

        {/* Vendor Button */}
        <button onClick={()=>{
            navigate("/vendor_form")
          }} className="mt-8 bg-[#E2E8F0] hover:bg-gray-300 text-gray-900 font-semibold px-6 py-3 rounded-lg transition">
          Become a Vendor
        </button>
      </main>
    </div>
    </div>
  )
}

export default Section1
