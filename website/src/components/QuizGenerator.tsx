import React, { useState, useCallback } from 'react';
import { Upload, FileText, Brain, Loader2, Play, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from './ui/use-toast';
import InteractiveQuiz from './InteractiveQuiz';

interface GeneratedQuiz {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
}

const QuizGenerator: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate quiz generation (in a real app, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockQuiz: GeneratedQuiz = {
        title: `Quiz from ${file.name}`,
        questions: [
          {
            question: "What is the main topic covered in this document?",
            options: ["Technology", "Business", "Science", "History"],
            correctAnswer: "Technology",
            explanation: "Based on the document content analysis."
          },
          {
            question: "Which concept is emphasized throughout the material?",
            options: ["Innovation", "Tradition", "Compliance", "Maintenance"],
            correctAnswer: "Innovation",
            explanation: "The document frequently mentions innovative approaches."
          },
          {
            question: "What is the recommended approach mentioned?",
            options: ["Waterfall", "Agile", "Traditional", "Hybrid"],
            correctAnswer: "Agile",
            explanation: "The document advocates for agile methodologies."
          },
          {
            question: "What framework is discussed in the document?",
            options: ["React", "Angular", "Vue", "Svelte"],
            correctAnswer: "React",
            explanation: "React framework is prominently featured."
          },
          {
            question: "Which development practice is recommended?",
            options: ["Test-driven", "Code-first", "Design-first", "Documentation-first"],
            correctAnswer: "Test-driven",
            explanation: "Test-driven development is emphasized for quality."
          },
          {
            question: "What is the primary focus of the methodology described?",
            options: ["Speed", "Quality", "Cost", "Flexibility"],
            correctAnswer: "Quality",
            explanation: "Quality assurance is the main focus throughout."
          },
          {
            question: "Which tool is mentioned for project management?",
            options: ["Jira", "Trello", "Asana", "Monday"],
            correctAnswer: "Jira",
            explanation: "Jira is referenced as the preferred tool."
          },
          {
            question: "What type of architecture is recommended?",
            options: ["Monolithic", "Microservices", "Serverless", "Hybrid"],
            correctAnswer: "Microservices",
            explanation: "Microservices architecture is advocated for scalability."
          },
          {
            question: "Which database approach is suggested?",
            options: ["SQL", "NoSQL", "Graph", "Hybrid"],
            correctAnswer: "Hybrid",
            explanation: "A hybrid approach combining SQL and NoSQL is recommended."
          },
          {
            question: "What is the deployment strategy mentioned?",
            options: ["Blue-Green", "Rolling", "Canary", "Recreate"],
            correctAnswer: "Blue-Green",
            explanation: "Blue-Green deployment is preferred for zero-downtime releases."
          }
        ]
      };

      setGeneratedQuiz(mockQuiz);
      toast({
        title: "Quiz generated successfully!",
        description: `Created ${mockQuiz.questions.length} questions from your PDF.`,
      });
    } catch (error) {
      toast({
        title: "Error generating quiz",
        description: "Failed to process the PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const downloadQuiz = () => {
    if (!generatedQuiz) return;
    
    const quizContent = `${generatedQuiz.title}\n\n${generatedQuiz.questions.map((q, index) => 
      `${index + 1}. ${q.question}\n${q.options.map((opt, i) => `   ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}\n\nCorrect Answer: ${q.correctAnswer}\n${q.explanation ? `Explanation: ${q.explanation}\n` : ''}\n`
    ).join('\n')}`;
    
    const blob = new Blob([quizContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedQuiz.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleQuizComplete = (score: number, answers: string[]) => {
    toast({
      title: "Quiz Completed!",
      description: `You scored ${score}/${generatedQuiz?.questions.length || 0} (${((score / (generatedQuiz?.questions.length || 1)) * 100).toFixed(0)}%)`,
    });
  };

  if (isQuizMode && generatedQuiz) {
    return (
      <InteractiveQuiz
        quiz={generatedQuiz}
        onBack={() => setIsQuizMode(false)}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-blue-400" />
          AI Quiz Generator
        </h2>
        <p className="text-gray-300 mb-6">
          Upload a PDF document and our AI will automatically generate quiz questions based on the content.
        </p>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-400 hover:border-blue-400 hover:bg-blue-400/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin" />
              <div>
                <p className="text-white font-medium">Processing your PDF...</p>
                <p className="text-gray-400 text-sm">AI is analyzing the content and generating quiz questions</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-white font-medium">Drop your PDF file here</p>
                <p className="text-gray-400 text-sm">or click to browse files</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <Button
                asChild
                variant="outline"
                className="border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200"
              >
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Select PDF File
                </label>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Generated Quiz Display */}
      {generatedQuiz && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">{generatedQuiz.title}</h3>
          <div className="space-y-6">
            {generatedQuiz.questions.map((question, index) => (
              <Card key={index} className="bg-white/5 border-white/10 p-4">
                <h4 className="text-white font-medium mb-3">
                  {index + 1}. {question.question}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="p-3 rounded-lg border border-gray-600 bg-gray-600/10 text-gray-300"
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <Button 
              onClick={() => setIsQuizMode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Take Quiz
            </Button>
            <Button 
              onClick={downloadQuiz}
              variant="outline"
              className="border-green-400 text-green-300 hover:bg-green-400/10 hover:text-green-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Quiz
            </Button>
            <Button 
              variant="outline"
              className="border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-200"
              onClick={() => setGeneratedQuiz(null)}
            >
              Generate New Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;