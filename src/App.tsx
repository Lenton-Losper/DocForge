import { useState } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Preview from './components/Preview';
import Features from './components/Features';
import WorkflowDiagram from './components/WorkflowDiagram';

function App() {
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.md'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload a valid file type: PDF, DOCX, DOC, or MD');
      return;
    }

    // Set analyzing state
    setIsAnalyzing(true);
    setUploadedFileName(file.name);

    // Simulate processing (2 seconds)
    setTimeout(() => {
      setIsAnalyzing(false);
      setDocumentUploaded(true);

      // Smooth scroll to preview section
      setTimeout(() => {
        const previewSection = document.getElementById('preview');
        if (previewSection) {
          previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero 
          onFileUpload={handleFileUpload}
          isAnalyzing={isAnalyzing}
        />
        <Preview 
          documentUploaded={documentUploaded}
          isAnalyzing={isAnalyzing}
          uploadedFileName={uploadedFileName}
        />
        <Features />
        <WorkflowDiagram />
      </main>
    </div>
  );
}

export default App;

