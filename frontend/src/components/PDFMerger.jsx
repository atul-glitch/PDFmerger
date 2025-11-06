import { Upload, FileText, X, Download, AlertCircle } from 'lucide-react';

export default function PDFMerger() {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      setError('Only PDF files are allowed');
      return;
    }
    
    setFiles([...files, ...pdfFiles]);
    setError('');
    setSuccess('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= files.length) return;
    
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files');
      return;
    }

    setMerging(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('pdfs', file);
    });

    try {
      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to merge PDFs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('PDFs merged successfully!');
      setFiles([]);
    } catch (err) {
      setError(err.message || 'Error merging PDFs');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF Merger</h1>
            <p className="text-gray-600">Upload and merge multiple PDF files into one</p>
          </div>

          {/* Upload Area */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-indigo-500 mb-3" />
                <p className="mb-2 text-sm text-gray-700 font-semibold">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <Download className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                        className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merge Button */}
          <button
            onClick={handleMerge}
            disabled={files.length < 2 || merging}
            className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {merging ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Merging...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Merge PDFs
              </>
            )}
          </button>

          {files.length > 0 && files.length < 2 && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Add at least one more PDF to merge
            </p>
          )}
        </div>
      </div>
    </div>
  );
}