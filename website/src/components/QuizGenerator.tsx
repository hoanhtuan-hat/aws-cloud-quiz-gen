// src/components/QuizGenerator.tsx
// All comments in English
import React, { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';

// ===== API endpoint (PUT -> API Gateway -> S3) =====
// Keep this consistent with your working API from the old file.
const API_BASE =
  'https://db5q720r7a.execute-api.us-east-2.amazonaws.com/upload_to_s3/upload';

// === SAMPLE DATA (KEEP) ===
// Keep your existing sample data here exactly as-is.
// Example (do NOT replace your real data):
// export const sampleQuizzes = [...];
// export const demoMeta = {...};
// ---------------------------------------------------

// Small helper to format errors
const readTextSafe = async (r: Response) => {
  try { return await r.text(); } catch { return ''; }
};

const QuizGenerator: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  // Open OS file picker
  const openPicker = () => inputRef.current?.click();

  // Core upload logic (shared by input change and drag-drop)
  const uploadPdf = async (file: File) => {
    // 1) Basic validations
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be < 10MB.');
      return;
    }

    // 2) PUT to API Gateway (which writes to S3)
    try {
      setBusy(true);
      const url = `${API_BASE}/${encodeURIComponent(file.name)}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });

      if (!res.ok) {
        const t = await readTextSafe(res);
        console.error('Upload failed:', res.status, res.statusText, t); // gateway/S3 error
        alert(`Upload failed (${res.status}). Please try again.`);
        return;
      }

      alert('Upload succeeded. Server will process your PDF...');
      // TODO: Add polling or navigation to game board after processing is ready.
    } catch (err) {
      console.error(err);
      alert('Unexpected error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Handle input file change
  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await uploadPdf(f);
    // Reset input so the same file can be selected again later
    e.target.value = '';
  };

  // Drag & drop handlers
  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) await uploadPdf(f);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-2">AI Quiz Generator</h2>
      <p className="text-gray-300 mb-6">
        Upload a PDF document and our AI will automatically generate quiz questions based on the content.
      </p>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-12 transition ${
          dragOver ? 'border-white/70 bg-white/5' : 'border-white/30'
        }`}
      >
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-white/80 mb-4" />
          <div className="text-white text-lg mb-1">Drop your PDF file here</div>
          <div className="text-gray-300 mb-6">or click to browse files</div>

          <Button
            onClick={openPicker}
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {busy ? 'Uploading...' : 'Select PDF File'}
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={onInputChange}
            hidden
          />
        </div>
      </div>

      {/* Optional: show a subtle hint while uploading */}
      {busy && (
        <p className="mt-4 text-sm text-gray-300">
          Uploading... please wait.
        </p>
      )}
    </div>
  );
};

export default QuizGenerator;
