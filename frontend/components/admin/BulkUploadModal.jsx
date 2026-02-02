"use client";

import { useState } from "react";
import api from "@/lib/api";

/**
 * Bulk Upload Modal Component for Admin
 * Handles student bulk upload with Excel validation and preview
 */
export default function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!validTypes.includes(selectedFile.type)) {
        alert('Please upload a valid Excel file (.xls or .xlsx)');
        return;
      }
      setFile(selectedFile);
      setValidationResult(null);
      setUploadResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setValidating(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.post('/admin/students/validate-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        setValidationResult(response.data.data);
      } else {
        alert(response.data?.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert(error.response?.data?.message || 'Failed to validate file');
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    if (validationResult && validationResult.errors && validationResult.errors.length > 0) {
      alert('Please fix validation errors before uploading');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.post('/admin/students/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        setUploadResult(response.data.data);
        alert(`Successfully uploaded ${response.data.data.created_count} students!`);
        if (onSuccess) onSuccess();
      } else {
        alert(response.data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.get('/admin/students/upload-template', {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_upload_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-gray-border">
          <div>
            <h2 className="text-xl font-semibold text-dark-text">Bulk Upload Students</h2>
            <p className="text-sm text-gray-700 mt-1">Upload Excel file to add multiple students at once</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-dark-text p-2"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">info</span>
              <div className="flex-1">
                <h3 className="font-medium text-dark-text mb-1">Download Template First</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Download the Excel template and fill in student details. Make sure all required fields are included.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-light-gray-border rounded-lg p-6">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-gray-700 mb-3 block">upload_file</span>
              <p className="text-sm text-gray-700 mb-4">
                {file ? file.name : 'Choose Excel file or drag and drop'}
              </p>
              <input
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer"
              >
                Select File
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleValidate}
              disabled={!file || validating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Validating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">fact_check</span>
                  Validate File
                </>
              )}
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || (validationResult?.errors?.length > 0)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">upload</span>
                  Upload Students
                </>
              )}
            </button>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`rounded-lg p-4 ${validationResult.errors?.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <h3 className="font-medium text-dark-text mb-2">Validation Results</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Total Rows:</span> {validationResult.total_rows || 0}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Valid Rows:</span> {validationResult.valid_rows || 0}
                </p>
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-red-600 mb-2">Errors Found:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-xs">
                          Row {error.row}: {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {(!validationResult.errors || validationResult.errors.length === 0) && (
                  <p className="text-green-600 font-medium">✓ No errors found. File is ready for upload!</p>
                )}
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-dark-text mb-2">Upload Complete!</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Students Created:</span> {uploadResult.created_count || 0}</p>
                <p><span className="font-medium">Students Updated:</span> {uploadResult.updated_count || 0}</p>
                <p><span className="font-medium">Skipped (duplicates):</span> {uploadResult.skipped_count || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-light-gray-border">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-light-gray-border rounded-lg hover:bg-gray-50 transition text-dark-text"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
