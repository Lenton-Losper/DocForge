// This component is kept for the "See example report" link functionality
// It shows a simple preview when scrolled to

const Preview = () => {
  return (
    <section id="preview" className="py-16 md:py-32 px-8 bg-[#F5F5F4]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-[#1C1917] mb-8">
          Example Documentation Report
        </h2>
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 shadow-lg">
          <div className="text-left space-y-4">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#E7E5E4]">
              <div>
                <p className="text-sm text-[#57534E] mb-2">Document Score</p>
                <p className="text-5xl font-bold text-[#1C1917]">68/100</p>
              </div>
            </div>
            <div className="space-y-3 text-[#57534E] leading-relaxed">
              <p>• Missing: Login troubleshooting section</p>
              <p>• Role mismatch: Admin content in user manual</p>
              <p>• Incomplete: 7 steps missing explanations</p>
              <p>• 12 screenshots need updating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Preview;
