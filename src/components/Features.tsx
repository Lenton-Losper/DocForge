import { Settings, Shield, Sparkles } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Settings,
      title: 'Automated Linting',
      description: 'Catch errors, gaps, and inconsistencies instantly',
    },
    {
      icon: Shield,
      title: 'Role-Based Validation',
      description: 'Ensure content matches user permissions',
    },
    {
      icon: Sparkles,
      title: 'AI Gap Filling',
      description: 'Generate missing steps and clarify vague instructions',
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        {/* Heading */}
        <h2 className="text-5xl font-bold text-gray-900 text-center mb-16">
          How DocDocs Works
        </h2>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl p-12 text-center h-80 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="bg-blue-50 rounded-full p-6 mb-6">
                  <IconComponent className="w-20 h-20 text-primary-blue" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
