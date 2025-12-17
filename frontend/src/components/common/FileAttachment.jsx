import React from 'react';

/**
 * File Attachment Component
 * Displays file attachments with download links
 * Supports images, PDFs, documents, etc.
 */
const FileAttachment = ({ fileName, fileUrl, fileType, fileSize }) => {
  if (!fileUrl || !fileName) return null;

  const getFileIcon = () => {
    if (!fileType) return '📎';
    
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = fileType?.startsWith('image/');

  return (
    <div className="my-2">
      {isImage ? (
        // Image Preview
        <div className="max-w-xs rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-auto object-cover max-h-64"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      ) : (
        // File Attachment Card
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors max-w-xs group"
        >
          <span className="text-2xl flex-shrink-0">{getFileIcon()}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
              {fileName}
            </p>
            {fileSize && (
              <p className="text-xs text-gray-500">
                {formatFileSize(fileSize)}
              </p>
            )}
          </div>
          <span className="text-gray-400 group-hover:text-blue-600 flex-shrink-0">
            ⬇️
          </span>
        </a>
      )}
    </div>
  );
};

export default FileAttachment;
