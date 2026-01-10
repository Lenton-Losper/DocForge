import { ArrowRight } from 'lucide-react';

const WorkflowSection = () => {
  const openWorkflow = () => {
    // Trigger workflow diagram via global function
    if ((window as any).openWorkflowDiagram) {
      (window as any).openWorkflowDiagram();
    } else {
      // Fallback: find and click the trigger button
      const workflowButton = document.querySelector('[data-workflow-trigger]');
      if (workflowButton) {
        (workflowButton as HTMLElement).click();
      }
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-8">
          Complete Documentation Pipeline
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          From code to comprehensive documentation. Automated, intelligent, always in sync.
        </p>
        <button
          onClick={openWorkflow}
          className="bg-primary-blue text-white px-12 py-6 rounded-xl font-semibold text-xl hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer inline-flex items-center space-x-3"
          aria-label="View workflow diagram"
        >
          <span>View Workflow Diagram</span>
          <ArrowRight className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default WorkflowSection;
