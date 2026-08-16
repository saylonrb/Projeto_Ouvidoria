import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AccessibilityBar from './AccessibilityBar';
import Chatbot from './Chatbot';

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />
      <main className="flex-1 w-full bg-gray-50">
        {children}
      </main>
      <Footer />
      <Chatbot />
      <AccessibilityBar />
    </div>
  );
}
