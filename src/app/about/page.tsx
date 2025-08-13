import { Button } from "@/components/ui/button";
import { Users, Target, Zap, Heart } from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Zap,
    title: "Innovation",
    description: "We push the boundaries of what's possible with AI and web technology."
  },
  {
    icon: Heart,
    title: "User-First",
    description: "Every feature we build is designed with our users' needs in mind."
  },
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for excellence in every aspect of our product and service."
  },
  {
    icon: Users,
    title: "Community",
    description: "We believe in building a strong, supportive community of creators."
  }
];

const team = [
  {
    name: "Alex Chen",
    role: "CEO & Founder",
    bio: "Former AI researcher at Google, passionate about democratizing web development."
  },
  {
    name: "Sarah Kim",
    role: "CTO",
    bio: "Full-stack engineer with 10+ years building scalable web applications."
  },
  {
    name: "Marcus Rodriguez",
    role: "Head of Design",
    bio: "Award-winning designer focused on creating intuitive user experiences."
  },
  {
    name: "Dr. Emily Watson",
    role: "Head of AI",
    bio: "PhD in Machine Learning, specializing in natural language processing."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About VIBE
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
            We're on a mission to democratize web development by making it accessible to everyone through the power of AI.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              The web should be accessible to everyone. Whether you're a small business owner, 
              a creative professional, or someone with a great idea, you should be able to 
              bring your vision to life online.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              That's why we built VIBE - an AI-powered website builder that transforms 
              your ideas into stunning, professional websites in seconds. No coding knowledge 
              required, no design skills needed. Just describe what you want, and watch it happen.
            </p>
            <div className="flex space-x-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Start Building
              </Button>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Our Vision
              </h3>
              <p className="text-gray-600">
                A world where anyone can create beautiful, functional websites that 
                represent their brand and achieve their goals online.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do at VIBE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Meet Our Team
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The passionate people behind VIBE who are working to revolutionize web development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-purple-600 text-sm mb-3">
                {member.role}
              </p>
              <p className="text-gray-600 text-sm">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-purple-100">Websites Built</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-purple-100">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-purple-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-purple-100">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Join the Revolution?
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Start building your website with AI today and see the difference VIBE can make.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            Get Started Free
          </Button>
          <Button size="lg" variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}