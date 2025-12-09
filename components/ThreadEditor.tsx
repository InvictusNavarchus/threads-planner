import React, { useState, useEffect } from 'react';
import { ThreadPost, ThreadSegment, THREAD_CHAR_LIMIT } from '../types';
import { Plus, X, Sparkles, Wand2, Split, Trash2 } from 'lucide-react';
import { splitIntoChain, polishContent } from '../services/geminiService';

interface ThreadEditorProps {
  post: ThreadPost;
  onSave: (post: ThreadPost) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export const ThreadEditor: React.FC<ThreadEditorProps> = ({ post, onSave, onCancel, onDelete }) => {
  const [internalPost, setInternalPost] = useState<ThreadPost>(post);
  const [loading, setLoading] = useState(false);
  const [splitInput, setSplitInput] = useState('');
  const [showSplitter, setShowSplitter] = useState(false);

  // Sync internal state if prop changes (though usually used in modal)
  useEffect(() => {
    setInternalPost(post);
  }, [post]);

  const updateSegment = (id: string, newContent: string) => {
    setInternalPost(prev => ({
      ...prev,
      segments: prev.segments.map(s => s.id === id ? { ...s, content: newContent } : s)
    }));
  };

  const addSegment = () => {
    const newSegment: ThreadSegment = {
      id: crypto.randomUUID(),
      content: ''
    };
    setInternalPost(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment]
    }));
  };

  const removeSegment = (id: string) => {
    if (internalPost.segments.length <= 1) return;
    setInternalPost(prev => ({
      ...prev,
      segments: prev.segments.filter(s => s.id !== id)
    }));
  };

  const handlePolish = async (segmentId: string, currentContent: string) => {
    if (!currentContent) return;
    setLoading(true);
    const polished = await polishContent(currentContent);
    updateSegment(segmentId, polished);
    setLoading(false);
  };

  const handleMagicSplit = async () => {
    if (!splitInput) return;
    setLoading(true);
    const parts = await splitIntoChain(splitInput);
    
    const newSegments: ThreadSegment[] = parts.map(part => ({
      id: crypto.randomUUID(),
      content: part
    }));

    setInternalPost(prev => ({
      ...prev,
      segments: newSegments
    }));
    setShowSplitter(false);
    setSplitInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Thread Editor</h3>
        <div className="flex gap-2">
           <button 
            onClick={() => setShowSplitter(!showSplitter)}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md hover:bg-purple-100 transition-colors"
          >
            <Split size={14} />
            Magic Split
          </button>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="animate-spin text-purple-600" size={32} />
              <p className="text-sm font-medium text-purple-600">Gemini is thinking...</p>
            </div>
          </div>
        )}

        {/* Magic Splitter Input */}
        {showSplitter && (
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6 animate-in slide-in-from-top-4">
            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <Wand2 size={16} /> Paste long text to create a chain
            </h4>
            <textarea
              className="w-full p-3 rounded-lg border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm mb-3 min-h-[120px]"
              placeholder="Paste your article or long thought here..."
              value={splitInput}
              onChange={(e) => setSplitInput(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowSplitter(false)}
                className="px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleMagicSplit}
                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
              >
                Generate Chain
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Internal Title</label>
            <input 
              type="text" 
              value={internalPost.title}
              onChange={(e) => setInternalPost(prev => ({...prev, title: e.target.value}))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              placeholder="e.g. Launch Announcement"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
              <input 
                type="time" 
                value={internalPost.time}
                onChange={(e) => setInternalPost(prev => ({...prev, time: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select 
                value={internalPost.status}
                onChange={(e) => setInternalPost(prev => ({...prev, status: e.target.value as any}))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black outline-none bg-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Chain Visualizer */}
        <div className="relative pl-4 space-y-2">
          {/* Vertical Line Connector */}
          <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-gray-200" />

          {internalPost.segments.map((segment, index) => {
            const charCount = segment.content.length;
            const isOverLimit = charCount > THREAD_CHAR_LIMIT;

            return (
              <div key={segment.id} className="relative group">
                <div className="flex gap-4 items-start">
                  {/* Avatar Placeholder */}
                  <div className="flex-shrink-0 z-10 bg-white py-1">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold ring-4 ring-white">
                      You
                    </div>
                  </div>

                  {/* Input Bubble */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400 font-medium ml-1">
                        {index === 0 ? 'Start thread' : 'Add to thread'}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePolish(segment.id, segment.content)}
                          title="Polish with AI"
                          className="p-1 hover:bg-purple-100 text-purple-600 rounded"
                        >
                          <Sparkles size={14} />
                        </button>
                        {internalPost.segments.length > 1 && (
                          <button
                            onClick={() => removeSegment(segment.id)}
                            className="p-1 hover:bg-red-100 text-red-500 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <textarea
                      value={segment.content}
                      onChange={(e) => updateSegment(segment.id, e.target.value)}
                      placeholder={index === 0 ? "What's new?" : "Say more..."}
                      className="w-full p-3 bg-transparent border-b border-gray-200 focus:border-black outline-none resize-none text-sm min-h-[100px]"
                    />
                    
                    <div className="flex justify-between items-center mt-1 px-1">
                      <span className={`text-[10px] font-medium ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                        {charCount} / {THREAD_CHAR_LIMIT}
                      </span>
                      {isOverLimit && <span className="text-[10px] text-red-500 font-bold">Too long!</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Post Button */}
          <div className="flex gap-4 items-center">
            <div className="w-8 flex justify-center">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              </div>
            </div>
            <button 
              onClick={addSegment}
              className="mt-2 text-xs font-medium text-gray-500 hover:text-black hover:underline flex items-center gap-1 transition-all"
            >
              <Plus size={14} /> Add to thread
            </button>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
        <button 
            onClick={() => {
                if(window.confirm("Are you sure you want to delete this thread plan?")) {
                    onDelete(internalPost.id);
                }
            }}
            className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
            Delete
        </button>
        <div className="flex gap-3">
            <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
            Cancel
            </button>
            <button 
            onClick={() => onSave(internalPost)}
            className="px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg shadow-sm transition-all"
            >
            Save Plan
            </button>
        </div>
      </div>
    </div>
  );
};