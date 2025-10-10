
import React from "react";
import { twMerge } from "tailwind-merge";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({ children, className = "", ...rest }) => (
    <button
        className={twMerge(`bg-gray-800 text-gray-100 px-4 py-2 rounded-xl transition 
                    hover:bg-gray-700 hover:text-white hover:cursor-pointer 
                    disabled:bg-gray-300 disabled:text-gray-100 disabled:cursor-default
                    ${className}`)}
        {...rest}          
        >
        {children}
    </button>
)

export default Button;