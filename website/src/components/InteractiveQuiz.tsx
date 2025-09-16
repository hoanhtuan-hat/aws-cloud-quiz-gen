import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

interface InteractiveQuizProps {
  quiz: GeneratedQuiz;
  onBack: () => void;
  onComplete: (score: number, answers: string[]) => void;
}

const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ quiz, onBack, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return;
    
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    
    setTimeout(() => {
      if (currentQuestionIndex === quiz.questions.length - 1) {
        // Quiz completed
        const score = newAnswers.reduce((acc, answer, index) => {
          return answer === quiz.questions[index].correctAnswer ? acc + 1 : acc;
        }, 0);
        setQuizCompleted(true);
        onComplete(score, newAnswers);
      } else {
        // Next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer('');
        setShowResult(false);
        setIsCorrect(false);
      }
    }, 2000);
  };

  const downloadQuiz = () => {
    const quizContent = `${quiz.title}\n\n${quiz.questions.map((q, index) => 
      `${index + 1}. ${q.question}\n${q.options.map((opt, i) => `   ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}\n\nCorrect Answer: ${q.correctAnswer}\n${q.explanation ? `Explanation: ${q.explanation}\n` : ''}\n`
    ).join('\n')}`;
    
    const blob = new Blob([quizContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (quizCompleted) {
    const score = userAnswers.reduce((acc, answer, index) => {
      return answer === quiz.questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
    const percentage = (score / quiz.questions.length) * 100;

    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-gray-400 text-gray-300 hover:bg-gray-400/10 hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quiz Generator
            </Button>
            <Button
              onClick={downloadQuiz}
              variant="outline"
              className="border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Quiz
            </Button>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Quiz Completed!</h2>
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
            </div>
            <div className="text-2xl font-bold text-white mb-2">
              {score}/{quiz.questions.length}
            </div>
            <div className="text-xl text-gray-300 mb-6">
              {percentage.toFixed(0)}% Score
            </div>
            
            <div className="max-w-md mx-auto">
              <Progress value={percentage} className="h-4 mb-4" />
              <p className="text-gray-300">
                {percentage >= 80 ? 'Excellent work!' : 
                 percentage >= 60 ? 'Good job!' : 
                 'Keep studying and try again!'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Review Your Answers</h3>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <Card key={index} className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-start space-x-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-2">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-gray-400">Your answer: </span>
                          <span className={isCorrect ? 'text-green-300' : 'text-red-300'}>
                            {userAnswer}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm">
                            <span className="text-gray-400">Correct answer: </span>
                            <span className="text-green-300">{question.correctAnswer}</span>
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-gray-400 italic mt-2">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gray-400 text-gray-300 hover:bg-gray-400/10 hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-right">
            <div className="text-white font-medium">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
            <div className="text-gray-400 text-sm">{quiz.title}</div>
          </div>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">
            {currentQuestion.question}
          </h2>

          {!showResult ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-50/10 text-blue-300'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-600/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedAnswer === option 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-500'
                    }`}>
                      {selectedAnswer === option && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="font-medium">{String.fromCharCode(65 + index)}. {option}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-lg flex items-center space-x-4 transition-all duration-300 ${
              isCorrect 
                ? 'bg-green-500/20 text-green-300 border-2 border-green-500/50' 
                : 'bg-red-500/20 text-red-300 border-2 border-red-500/50'
            }`}>
              {isCorrect ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
              <div>
                <div className="font-bold text-xl mb-1">
                  {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </div>
                <div className="text-sm opacity-90">
                  {isCorrect 
                    ? 'Great job! Moving to the next question...' 
                    : `The correct answer was: ${currentQuestion.correctAnswer}`
                  }
                </div>
                {!isCorrect && currentQuestion.explanation && (
                  <div className="text-sm opacity-75 mt-2 italic">
                    {currentQuestion.explanation}
                  </div>
                )}
              </div>
            </div>
          )}

          {!showResult && (
            <Button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
            >
              Submit Answer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuiz;