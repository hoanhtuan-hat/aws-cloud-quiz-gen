import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Brain, Loader2, Play, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from './ui/use-toast';
import InteractiveQuiz from './InteractiveQuiz';

const API_UPLOAD_PDF =
  'https://db5q720r7a.execute-api.us-east-2.amazonaws.com/upload_to_s3/upload';

const API_GET_QUIZ_JSON =
  'https://s17lxurnji.execute-api.us-east-2.amazonaws.com/return_json/return_json_data';

interface GeneratedQuiz {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
}

const readTextSafe = async (r: Response) => {
  try {
    return await r.text();
  } catch {
    return '';
  }
};

const arrayBufferToHex = (arrayBuffer: ArrayBuffer) => {
  return Array.prototype.map
    .call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, '0'))
    .join('');
};

// Hàm tính toán jobId từ nội dung file, đảm bảo khớp với backend
const sha256 = async (input: ArrayBuffer) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', input);
  const hashArray = new Uint8Array(hashBuffer);
  const base64string = btoa(
    String.fromCharCode.apply(null, Array.from(hashArray))
  );
  return base64string.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const QuizGenerator: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const uploadPdf = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file only.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // BƯỚC 1: TÍNH TOÁN jobId ĐỂ DÙNG SAU NÀY
      const fileBuffer = await file.arrayBuffer();
      const jobId = await sha256(fileBuffer);
      console.log(`Computed jobId from file content: ${jobId}`);
      
      // BƯỚC 2: GỌI API UPLOAD
      const uploadResponse = await fetch(`${API_UPLOAD_PDF}/${encodeURIComponent(file.name)}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await readTextSafe(uploadResponse);
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      console.log(`PDF uploaded. Starting polling with jobId: ${jobId}`);
      // BƯỚC 3: GỌI HÀM POLLFORQUIZ VỚI JOBID VỪA TẠO
      await pollForQuiz(jobId);
    } catch (error) {
      console.error('An error occurred:', error);
      toast({
        title: 'Error',
        description: `An error occurred while generating the quiz: ${error}`,
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const pollForQuiz = async (jobId: string) => {
    let quizData: GeneratedQuiz | null = null;
    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 3000;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Polling for quiz data (Attempt ${attempts}/${maxAttempts})...`);
      try {
        const response = await fetch(`${API_GET_QUIZ_JSON}/${jobId}`);
        const data = await response.json();

        // FIX: Directly check for 'title' property to confirm valid quiz data
        if (response.ok && data.title) {
          console.log('Quiz data is ready!');
          quizData = data;
          setGeneratedQuiz(data);
          setIsProcessing(false);
          toast({
            title: 'Success',
            description: 'Quiz generated successfully!',
            variant: 'success',
          });
          break;
        } else if (response.ok && data.status === 'processing') {
          console.log('Quiz is still processing. Waiting...');
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        } else {
          throw new Error(`API error: ${data.message || data.error}`);
        }
      } catch (error) {
        console.error('Polling failed:', error);
        toast({
          title: 'Error fetching quiz',
          description: `An error occurred: ${error}`,
          variant: 'destructive',
        });
        setIsProcessing(false);
        break;
      }
    }

    if (!quizData) {
      toast({
        title: 'Quiz not ready',
        description: 'Timeout reached. Please try again later.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        uploadPdf(file);
      }
    },
    [uploadPdf]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        uploadPdf(file);
      }
    },
    [uploadPdf]
  );

  const downloadQuiz = () => {
    if (generatedQuiz) {
      const jsonContent = JSON.stringify(generatedQuiz, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quiz.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (isQuizMode && generatedQuiz) {
    return <InteractiveQuiz quiz={generatedQuiz} onReturn={() => setIsQuizMode(false)} />;
  }

  return (
    <div className='bg-slate-900 rounded-xl p-6 border border-white/20'>
      <h2 className='text-2xl font-bold text-white mb-2'>AI Quiz Generator</h2>
      <p className='text-gray-300 mb-6'>
        Upload a PDF document and our AI will automatically generate quiz questions based on the content.
      </p>

      {!generatedQuiz && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`border-2 border-dashed rounded-xl p-12 transition ${
            isDragging ? 'border-white/70 bg-white/5' : 'border-white/30'
          }`}
        >
          <div className='flex flex-col items-center'>
            {isProcessing ? (
              <>
                <Loader2 className='w-12 h-12 text-white/80 mb-4 animate-spin' />
                <div className='text-white text-lg mb-1'>Processing...</div>
                <div className='text-gray-300 mb-6'>Please wait a moment.</div>
              </>
            ) : (
              <>
                <Upload className='w-12 h-12 text-white/80 mb-4' />
                <div className='text-white text-lg mb-1'>Drag and drop your PDF file here</div>
                <div className='text-gray-300 mb-6'>or click to browse files</div>
              </>
            )}

            <Button
              onClick={openPicker}
              disabled={isProcessing}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isProcessing ? 'Uploading...' : 'Select PDF File'}
            </Button>

            <input
              ref={inputRef}
              type='file'
              accept='application/pdf'
              onChange={onInputChange}
              hidden
            />
          </div>
        </div>
      )}

      {generatedQuiz && (
        <div className='mt-6'>
          <h3 className='text-xl font-bold text-white mb-4'>Your quiz is ready!</h3>
          <p className='text-gray-300 mb-4'>{generatedQuiz.questions.length} questions have been generated.</p>

          <div className='space-y-4'>
            {generatedQuiz.questions.map((question, questionIndex) => (
              <Card
                key={questionIndex}
                className='bg-slate-800/50 border-gray-600 p-4'
              >
                <div className='flex items-start mb-2'>
                  <span className='font-bold text-lg text-blue-400 mr-2'>{questionIndex + 1}.</span>
                  <p className='text-white'>{question.question}</p>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-3'>
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className='p-3 rounded-lg border border-gray-600 bg-gray-600/10 text-gray-300'
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className='flex flex-wrap gap-4 mt-6'>
            <Button
              onClick={() => setIsQuizMode(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Play className='w-4 h-4 mr-2' />
              Take Quiz
            </Button>
            <Button
              onClick={downloadQuiz}
              variant='outline'
              className='border-green-400 text-green-300 hover:bg-green-400/10 hover:text-green-200'
            >
              <Download className='w-4 h-4 mr-2' />
              Download Quiz
            </Button>
            <Button
              variant='outline'
              className='border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-200'
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