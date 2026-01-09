import { useState, useEffect } from 'react';
import {
  FileText,
  Network,
  Brain,
  Settings,
  Lightbulb,
  FileSearch,
  Download,
  X,
  ArrowDown,
} from 'lucide-react';

const WorkflowDiagram = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on Escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            How DocForge Works
          </h2>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primary-blue text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer"
            aria-label="View workflow diagram"
          >
            View Workflow Diagram
          </button>
        </div>
      </section>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          aria-label="Close workflow diagram"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                DocForge AI Documentation Workflow
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close workflow diagram"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {/* Workflow Steps */}
              <div className="space-y-6">
                {/* Step 1: Upload */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                  <div className="bg-blue-50 rounded-full p-4 flex-shrink-0">
                    <FileText className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 1: Upload</h3>
                    <p className="text-gray-600">User uploads DOCX / PDF</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>

                {/* Step 2: Parse Text */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                  <div className="bg-blue-50 rounded-full p-4 flex-shrink-0">
                    <Network className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 2: Parse Text</h3>
                    <p className="text-gray-600">Structure extracted</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>

                {/* Steps 3 & 4: Parallel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Step 3: AI Analysis */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="bg-blue-50 rounded-full p-4 w-fit mb-4">
                      <Brain className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 3: AI Analysis</h3>
                    <p className="text-gray-600">Content analyzed for gaps and issues</p>
                  </div>

                  {/* Step 4: Rules Engine */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="bg-blue-50 rounded-full p-4 w-fit mb-4">
                      <Settings className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 4: Rules Engine</h3>
                    <p className="text-gray-600">Validation rules applied</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>

                {/* Step 5: Suggestions */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                  <div className="bg-blue-50 rounded-full p-4 flex-shrink-0">
                    <Lightbulb className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 5: Suggestions</h3>
                    <p className="text-gray-600">Fixes returned as structured data</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>

                {/* Step 6: Generate Document */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                  <div className="bg-blue-50 rounded-full p-4 flex-shrink-0">
                    <FileSearch className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 6: Generate Document</h3>
                    <p className="text-gray-600">User approves changes</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>

                {/* Step 7: Export */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                  <div className="bg-blue-50 rounded-full p-4 flex-shrink-0">
                    <Download className="w-8 h-8 text-primary-blue" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Step 7: Export</h3>
                    <p className="text-gray-600">Final DOCX download</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowDiagram;

