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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-50 rounded-full p-4">
                    <IconComponent className="w-12 h-12 text-primary-blue" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

