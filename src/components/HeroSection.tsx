"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Shield, Lock, Users } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NetworkBackground from "./NetworkBackground";

const ModuleCard = ({
  module,
  featured,
}: {
  module: any;
  featured: boolean;
}) => {
  return (
    <div className="relative group bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      {featured && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white px-4 py-1 rounded-full text-sm animate-pulse">
          Featured
        </div>
      )}
      <div className="overflow-hidden rounded-lg mb-4">
        <img
          src={module.image}
          alt={module.title}
          className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {module.title}
      </h3>
      <p className="text-gray-600 mb-4">{module.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">
          {module.duration}
        </span>
        <button className="flex items-center space-x-2 bg-[var(--neon-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--medium-blue)] transition-colors">
          <Shield />
          <span>Start Training</span>
        </button>
      </div>
    </div>
  );
};

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const modules = [
    {
      id: 1,
      title: "Phishing Awareness",
      description:
        "Learn to identify and avoid phishing attacks through interactive scenarios and real-world examples.",
      duration: "15 min",
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: true,
    },
    {
      id: 2,
      title: "Password Security",
      description:
        "Master the art of creating and managing strong passwords to protect your digital identity.",
      duration: "12 min",
      image:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: 3,
      title: "Social Engineering",
      description:
        "Understand how attackers manipulate human psychology and learn to defend against these tactics.",
      duration: "18 min",
      image:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % modules.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + modules.length) % modules.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Network Animation Background */}
      <NetworkBackground />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
            Master Cybersecurity, Protect Your Digital World.
          </h1>
          <p className="text-xl text-[var(--light-blue)] leading-relaxed">
            Interactive training modules designed to enhance your cybersecurity
            awareness. Learn through engaging scenarios and real-world examples.
          </p>
          <button className="group inline-flex items-center space-x-3 bg-[var(--neon-blue)] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[var(--medium-blue)] transform hover:scale-105 transition-all duration-300">
            <span>Explore All Modules</span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>

        <div className="relative perspective-1000">
          <div className="overflow-hidden rounded-2xl transition-all duration-700 transform hover:scale-105">
            <div className="relative">
              <div className="transition-opacity duration-500 ease-in-out">
                <ModuleCard
                  module={modules[currentSlide]}
                  featured={modules[currentSlide].featured}
                />
              </div>

              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {modules.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentSlide === index
                        ? "bg-[var(--neon-blue)] w-4"
                        : "bg-gray-300"
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-4">
                <button
                  onClick={prevSlide}
                  className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 transform"
                  aria-label="Previous module"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={nextSlide}
                  className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 transform"
                  aria-label="Next module"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 w-full pointer-events-none">
                <div className="absolute -left-4 opacity-20 transform -translate-x-full scale-90 blur-sm">
                  <ModuleCard
                    module={
                      modules[
                        (currentSlide - 1 + modules.length) % modules.length
                      ]
                    }
                    featured={
                      modules[
                        (currentSlide - 1 + modules.length) % modules.length
                      ].featured
                    }
                  />
                </div>
                <div className="absolute -right-4 opacity-20 transform translate-x-full scale-90 blur-sm">
                  <ModuleCard
                    module={modules[(currentSlide + 1) % modules.length]}
                    featured={
                      modules[(currentSlide + 1) % modules.length].featured
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
