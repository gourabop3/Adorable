import { Button } from "@/components/ui/button";
import { Zap, Palette, Code, Globe, Users, Shield, Rocket, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Generation",
    description: "Create complete websites from simple text descriptions using advanced AI models.",
    details: [
      "Natural language to website conversion",
      "Multiple AI model support",
      "Context-aware content generation",
      "Intelligent layout optimization"
    ]
  },
  {
    icon: Palette,
    title: "Smart Design System",
    description: "Automatically generate beautiful, responsive designs that follow modern web standards.",
    details: [
      "Responsive design by default",
      "Modern UI/UX patterns",
      "Accessibility compliance",
      "Cross-browser compatibility"
    ]
  },
  {
    icon: Code,
    title: "Custom Code Integration",
    description: "Add custom functionality with built-in code editor and component system.",
    details: [
      "Custom component creation",
      "JavaScript/TypeScript support",
      "CSS customization",
      "API integration tools"
    ]
  },
  {
    icon: Globe,
    title: "Instant Deployment",
    description: "Deploy your website to production with one click, complete with CDN and SSL.",
    details: [
      "One-click deployment",
      "Global CDN distribution",
      "Automatic SSL certificates",
      "Custom domain support"
    ]
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together with your team on website projects with real-time collaboration.",
    details: [
      "Real-time editing",
      "Role-based permissions",
      "Version control",
      "Comment and feedback system"
    ]
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with enterprise features for large organizations.",
    details: [
      "SOC 2 compliance",
      "Data encryption",
      "Access controls",
      "Audit logging"
    ]
  },
  {
    icon: Rocket,
    title: "Performance Optimization",
    description: "Automatically optimize your website for speed and performance.",
    details: [
      "Image optimization",
      "Code minification",
      "Lazy loading",
      "Performance monitoring"
    ]
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track your website's performance with built-in analytics and insights.",
    details: [
      "Traffic analytics",
      "User behavior tracking",
      "Performance metrics",
      "SEO insights"
    ]
  }
];

const useCases = [
  {
    title: "E-commerce Websites",
    description: "Build online stores with product catalogs, shopping carts, and payment processing.",
    features: ["Product management", "Order processing", "Payment integration", "Inventory tracking"]
  },
  {
    title: "Business Websites",
    description: "Create professional business websites with company information and contact forms.",
    features: ["Company profiles", "Service showcases", "Contact forms", "Lead generation"]
  },
  {
    title: "Portfolio Sites",
    description: "Showcase your work with beautiful portfolio websites and project galleries.",
    features: ["Project galleries", "Resume sections", "Blog integration", "Social media links"]
  },
  {
    title: "Blog & Content",
    description: "Publish content with powerful blogging tools and content management.",
    features: ["Rich text editor", "SEO optimization", "Social sharing", "Comment systems"]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Powerful Features for Modern Websites
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
            Everything you need to build, deploy, and manage stunning websites. Powered by AI, designed for humans.
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary">
              Start Building Free
            </Button>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Core Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the powerful capabilities that make VIBE the ultimate AI website builder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.details.map((detail) => (
                  <li key={detail} className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect For Every Use Case
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple landing pages to complex applications, VIBE handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="bg-white rounded-xl p-8 shadow-lg"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {useCase.description}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {useCase.features.map((feature) => (
                    <div key={feature} className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Capabilities */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Advanced AI Capabilities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI understands context, learns from feedback, and continuously improves your websites.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Intelligent Website Generation
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Natural Language Processing</h4>
                  <p className="text-gray-600">Describe your website in plain English and watch it come to life.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Context-Aware Design</h4>
                  <p className="text-gray-600">AI automatically chooses the best layout and components for your content.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Iterative Refinement</h4>
                  <p className="text-gray-600">Make changes with simple prompts and see instant updates.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Try It Now
              </h4>
              <p className="text-gray-600 mb-4">
                Experience the power of AI website generation
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Start Building
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience the Future of Website Building?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already building amazing websites with VIBE.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}