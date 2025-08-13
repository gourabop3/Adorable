import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Zap, Users, Settings, Rocket } from "lucide-react";

const docCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics and create your first website",
    icon: Rocket,
    color: "from-blue-500 to-purple-500",
    articles: [
      "Quick Start Guide",
      "Creating Your First Website",
      "Understanding AI Prompts",
      "Template Selection"
    ]
  },
  {
    title: "AI Features",
    description: "Master the AI-powered website generation",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    articles: [
      "Writing Effective Prompts",
      "AI Model Selection",
      "Customizing AI Output",
      "Iterative Refinement"
    ]
  },
  {
    title: "Customization",
    description: "Make your website truly unique",
    icon: Settings,
    color: "from-green-500 to-blue-500",
    articles: [
      "Theme Customization",
      "Layout Modifications",
      "Component Styling",
      "Responsive Design"
    ]
  },
  {
    title: "Advanced Features",
    description: "Unlock powerful capabilities",
    icon: Code,
    color: "from-orange-500 to-red-500",
    articles: [
      "Custom Components",
      "API Integration",
      "Database Setup",
      "Deployment Options"
    ]
  },
  {
    title: "Team Collaboration",
    description: "Work together with your team",
    icon: Users,
    color: "from-indigo-500 to-purple-500",
    articles: [
      "Team Management",
      "Role Permissions",
      "Shared Projects",
      "Version Control"
    ]
  },
  {
    title: "API Reference",
    description: "Integrate VIBE into your workflow",
    icon: BookOpen,
    color: "from-gray-500 to-gray-700",
    articles: [
      "Authentication",
      "Website Generation",
      "Content Management",
      "Webhooks"
    ]
  }
];

const quickLinks = [
  { title: "API Documentation", href: "/docs/api", description: "Complete API reference" },
  { title: "Tutorials", href: "/docs/tutorials", description: "Step-by-step guides" },
  { title: "Examples", href: "/docs/examples", description: "Real-world use cases" },
  { title: "Troubleshooting", href: "/docs/troubleshooting", description: "Common issues and solutions" }
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            VIBE Documentation
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
            Everything you need to build amazing websites with AI. From beginner guides to advanced integrations.
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary">
              Start Building
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group block p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {link.title}
              </h3>
              <p className="text-gray-600 mt-2">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Documentation Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {docCategories.map((category) => (
            <div
              key={category.title}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-4`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {category.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {category.description}
              </p>
              <ul className="space-y-2">
                {category.articles.map((article) => (
                  <li key={article}>
                    <Link
                      href={`/docs/${category.title.toLowerCase().replace(/\s+/g, '-')}/${article.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-purple-600 hover:text-purple-800 text-sm hover:underline"
                    >
                      {article}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Articles */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "How to Write AI Prompts That Generate Perfect Websites",
              "Customizing Your Website's Design and Layout",
              "Integrating Third-Party Services and APIs",
              "Optimizing Your Website for Search Engines",
              "Setting Up Custom Domains and SSL",
              "Managing Team Access and Permissions"
            ].map((article) => (
              <div
                key={article}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  <Link href="#" className="hover:text-purple-600">
                    {article}
                  </Link>
                </h3>
                <p className="text-gray-600 text-sm">
                  Learn the best practices and tips for creating amazing websites with VIBE.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Our support team is here to help. Get in touch and we'll guide you through any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Contact Support
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              Join Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}