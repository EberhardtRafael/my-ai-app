'use client'

import React, { useState } from "react";
import { signIn } from "next-auth/react";

const LoginPage = () => {
    const signInText = "Sign In";
    const [userName, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await signIn("credentials", { userName, password, redirect: true, callbackUrl: "/" });
    };

   return (
   <div className="flex min-h-screen items-center justify-center">
        <form className="flex flex-col gap-1 items-left" onSubmit={handleSubmit}>
            <input className="border border-gray-400 rounded-xl p-1 px-2" type="text" value={userName} onChange={e => setUsername(e.target.value)} placeholder="Username" />
            <input className="border border-gray-400 rounded-xl p-1 px-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            <button
                className="
                    border border-gray-400 rounded-xl p-1 px-2 bg-gray-900 text-gray-100
                    hover:bg-gray-700 hover:text-white
                "
                type="submit"
            >
                {signInText}
            </button>
        </form>
   </div>
    
  );
}

export default LoginPage;