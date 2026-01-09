import { X, AlertTriangle, CheckCircle, ArrowRight, Upload, Loader2 } from 'lucide-react';

interface PreviewProps {
  documentUploaded: boolean;
  isAnalyzing: boolean;
  uploadedFileName: string;
}

const Preview = ({ documentUploaded, isAnalyzing, uploadedFileName }: PreviewProps) => {
  // Generate a mock score based on file name (for demo purposes)
  // In production, this would come from the API response
  const getDocumentScore = () => {
    // Simple hash-based score for consistency
    if (!uploadedFileName) return 68;
    const hash = uploadedFileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 60 + (hash % 40); // Score between 60-100
  };

  const documentScore = getDocumentScore();

  return (
    <section id="preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
          See what's wrong in 60 seconds
        </h2>

        {/* Conditional Rendering: Empty State or Results */}
        {!documentUploaded ? (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="text-center py-12">
              {isAnalyzing ? (
                /* Analyzing State */
                <div className="flex flex-col items-center">
                  <Loader2 className="w-16 h-16 text-primary-blue animate-spin mb-4" aria-hidden="true" />
                  <p className="text-lg text-gray-700 font-medium mb-2">Analyzing your document...</p>
                  <p className="text-sm text-gray-500">{uploadedFileName}</p>
                </div>
              ) : (
                /* Placeholder State */
                <>
                  <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p className="text-gray-500 text-lg">
                    Upload a document above to see your documentation quality report
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Results Card */
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 transition-opacity duration-500">
            {/* Top Row: Document Score */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Document Score</p>
                <p className="text-4xl sm:text-5xl font-bold text-gray-900">{documentScore}/100</p>
                {uploadedFileName && (
                  <p className="text-xs text-gray-500 mt-1">{uploadedFileName}</p>
                )}
              </div>
              <button
                className="mt-4 sm:mt-0 bg-primary-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer inline-flex items-center space-x-2"
                aria-label="Fix these issues"
              >
                <span>Fix These Issues</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
              {/* Issue 1 */}
              <div className="flex items-start space-x-4">
                <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Missing:</span> Login troubleshooting section
                  </p>
                </div>
              </div>

              {/* Issue 2 */}
              <div className="flex items-start space-x-4">
                <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Role mismatch:</span> Admin content in user manual
                  </p>
                </div>
              </div>

              {/* Issue 3 */}
              <div className="flex items-start space-x-4">
                <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Incomplete:</span>{' '}
                    <span className="text-primary-blue font-medium">7 steps missing explanations</span>
                  </p>
                </div>
              </div>

              {/* Issue 4 */}
              <div className="flex items-start space-x-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="text-primary-blue font-medium">12 screenshots need updating</span>
                  </p>
                </div>
              </div>

              {/* Positive feedback */}
              <div className="flex items-start space-x-4 pt-2">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Good structure</span> in Section 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Preview;

