const TechStackFooter = () => {
  const techStack = ['Next.js', 'FastAPI', 'OpenAI', 'Tailwind', 'AWS'];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm text-gray-500 mb-8">Built with modern tools</p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400">
          {techStack.map((tech, index) => (
            <span key={index} className="text-sm">
              {tech}
              {index < techStack.length - 1 && <span className="mx-2">•</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackFooter;
