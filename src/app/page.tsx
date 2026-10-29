"use client";
import { useState } from "react";

export default function Home(){
  const [jobDesc, setJobDesc] = useState(
    "Write a professional job application email for a fresher full-stack developer"
  )
  const [reply , setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(){
    setLoading(true);
    setError("")
    setReply("")

    try{
      const response = await fetch("/api/agent",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({jobDesc})
      })

      const data = await response.json();

      if(!response.ok){
        throw new Error(data.error || "Request failed")
      }

      setReply(data.reply)

    }catch(error){
      setError(
        error instanceof Error ? error.message : "Somthing went wrong."
      )
    }finally{
      setLoading(false)
    }
  }

  return(
    <main className="flex flex-col justify-center items-center gap-4 mt-20">
      
      <h1 className="text-3xl font-bold">
        My First LangChain App
      </h1>
      
      <textarea
      className="w-3xl rounded border p-3"
      rows={5}
      value={jobDesc}
      onChange={(e) => setJobDesc(e.target.value)}
      />
      
      <button 
      className="rounded bg-emerald-500 py-2 p-3 text-white disabled:opacity-50"
      onClick={handleSubmit}
      disabled={loading || !jobDesc.trim()}
      >
        {loading ? "Thinking...":"Ask AI"}
      </button>
      {error && (
        <p className="text-red-600">{error}</p>
      )}
      
      {reply &&(
        <section className="w-3xl whitespace-pre-wrap rounded border p-4">
          <h2 className="mb-2 font-semibold">
            AI Response
          </h2>
          {reply}
        </section>
      )}
    </main>
  )
}