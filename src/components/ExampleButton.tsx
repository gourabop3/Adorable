"use client";

import React from "react";

interface ExampleButtonProps {
  text: string;
  promptText: string;
  onClick: (text: string) => void;
  className?: string;
}

export function ExampleButton({ text, promptText, onClick, className = "" }: ExampleButtonProps) {
  return (
    <button
      onClick={() => onClick(promptText)}
      className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-2xl mb-3">{text === "E-commerce Store" ? "🛍️" : 
          text === "Business Website" ? "🏢" : 
          text === "Portfolio Site" ? "🎨" : 
          text === "Blog Platform" ? "📝" : "✨"}</div>
        
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
          {text}
        </h3>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          {text === "E-commerce Store" && "Modern online store with product catalog, shopping cart, and payment integration"}
          {text === "Business Website" && "Professional business site with company information, services, and contact forms"}
          {text === "Portfolio Site" && "Stunning portfolio to showcase your work, skills, and professional experience"}
          {text === "Blog Platform" && "Content management system with beautiful typography and reader engagement"}
        </p>
        
        {/* Hover indicator */}
        <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="text-sm font-medium">Try this example</span>
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      
      {/* Border animation */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 transition-colors duration-300" />
    </button>
  );
}
