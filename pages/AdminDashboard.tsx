import React, { useState, useEffect } from 'react';
import { Sermon, AdminView } from '../types';
import { subscribeToSermons, saveSermon, deleteSermon } from '../services/storage';
import { generateSermonMetadata } from '../services/geminiService';
import { ChevronLeft, SparklesIcon } from '../components/Icons';

const AdminDashboard: React.FC = () => {
  const [view, setView] = useState<AdminView>(AdminView.LOGIN);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'godfirst') {
      setView(AdminView.LIST);
      setError('');
    } else {
      setError('Incorrect password. (Hint: godfirst)');
    }
  };

  if (view === AdminView.LOGIN) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border-t-4 border-amber-400 text-center transition-colors">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 brand-font uppercase">Admin Access</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Enter password to manage sermons.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-400"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition uppercase tracking-wide">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminManager setView={setView} view={view} />;
};

const AdminManager: React.FC<{ setView: (v: AdminView) => void, view: AdminView }> = ({ setView, view }) => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSermons(setSermons);
    return () => unsubscribe();
  }, []);

  const handleEdit = (sermon: Sermon) => {
    setEditingSermon(sermon);
    setView(AdminView.EDIT);
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      setIsProcessing(true);
      await deleteSermon(id);
      setIsProcessing(false);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => {
        setDeleteConfirmId(prev => prev === id ? null : prev);
      }, 3000);
    }
  };

  const handleSave = async (sermon: Sermon) => {
    setIsProcessing(true);
    await saveSermon(sermon);
    setIsProcessing(false);
    setView(AdminView.LIST);
  };

  if (view === AdminView.LIST) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white brand-font uppercase">Manage Sermons</h2>
          <button 
            onClick={() => { setEditingSermon(null); setView(AdminView.CREATE); }}
            className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 font-medium uppercase text-sm tracking-wide"
          >
            + Add New
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 hidden sm:table-cell">Preacher</th>
                <th className="px-6 py-4 hidden md:table-cell">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sermons.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{s.title}</div>
                    <div className="sm:hidden text-xs text-slate-500 dark:text-slate-400">{s.preacher}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{s.preacher}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm hidden md:table-cell">{s.date}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(s)} 
                      disabled={isProcessing}
                      className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-medium text-sm uppercase disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)} 
                      disabled={isProcessing}
                      className={`font-medium text-sm uppercase transition-all duration-200 disabled:opacity-50 ${
                        deleteConfirmId === s.id 
                          ? 'bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 shadow-sm' 
                          : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                      }`}
                    >
                      {deleteConfirmId === s.id ? 'Sure?' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {sermons.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No sermons found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 p-4 rounded-lg text-sm text-sky-900 dark:text-sky-200">
          <strong>Note on Storage:</strong> Audio files are hosted on OpenDrive. The database only stores the text details and links.
        </div>
      </div>
    );
  }

  return (
    <SermonForm 
      initialData={editingSermon} 
      onSave={handleSave} 
      onCancel={() => setView(AdminView.LIST)} 
      isProcessing={isProcessing}
    />
  );
};

const SermonForm: React.FC<{ initialData: Sermon | null, onSave: (s: Sermon) => void, onCancel: () => void, isProcessing: boolean }> = ({ initialData, onSave, onCancel, isProcessing }) => {
  const [formData, setFormData] = useState<Partial<Sermon>>(initialData || {
    title: '',
    preacher: 'Rev. David Jenkins',
    series: '',
    date: new Date().toISOString().split('T')[0],
    scripture: '',
    description: '',
    audioUrl: '',
    tags: []
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAIContent = async () => {
    if (!formData.title || !formData.scripture) {
      alert("Please enter a Title and Scripture first.");
      return;
    }
    setIsGenerating(true);
    const result = await generateSermonMetadata(
      formData.title, 
      formData.scripture, 
      formData.preacher || 'Unknown'
    );
    setFormData(prev => ({
      ...prev,
      description: result.summary,
      tags: result.tags
    }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.audioUrl) {
      alert("Title and Audio URL are required");
      return;
    }
    
    // For new entries, we don't need an ID, Firestore creates it.
    // For edits, we keep the existing ID.
    onSave({
      id: initialData?.id || '', 
      title: formData.title!,
      preacher: formData.preacher || '',
      series: formData.series || 'Sunday Service',
      date: formData.date || '',
      scripture: formData.scripture || '',
      description: formData.description || '',
      audioUrl: formData.audioUrl!,
      tags: formData.tags || [],
      duration: 'Unknown'
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onCancel} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to List
      </button>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 transition-colors">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white brand-font uppercase">{initialData ? 'Edit Sermon' : 'Add New Sermon'}</h2>
           <button 
             type="button"
             onClick={generateAIContent}
             disabled={isGenerating || isProcessing}
             className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors disabled:opacity-50 font-medium"
           >
             {isGenerating ? 'Thinking...' : <><SparklesIcon className="w-4 h-4" /> AI Assist</>}
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input 
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input 
                type="date"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preacher</label>
              <input 
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                value={formData.preacher} 
                onChange={e => setFormData({...formData, preacher: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Series</label>
              <input 
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                value={formData.series} 
                onChange={e => setFormData({...formData, series: e.target.value})} 
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scripture Reference</label>
             <input 
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                placeholder="e.g. John 3:16"
                value={formData.scripture} 
                onChange={e => setFormData({...formData, scripture: e.target.value})} 
              />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
             <textarea 
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
          </div>

          {/* New Audio Process Section */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-8 space-y-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white brand-font uppercase border-b border-slate-100 dark:border-slate-700 pb-2">Upload Process</h3>
            
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center border border-slate-200 dark:border-slate-600">1</div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase mb-1">File Size Check</h4>
                 <p className="text-sm text-slate-600 dark:text-slate-400">
                    Make sure the mp3 is below 100MB (Use <a href="https://www.audacityteam.org/" target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">Audacity</a> to compress if needed).
                 </p>
               </div>
            </div>

             {/* Step 2 */}
            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center border border-slate-200 dark:border-slate-600">2</div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase mb-1">Upload to Open Drive</h4>
                 <a href="https://www.opendrive.com/files/MTJfMTkzOTExNF9BcTM0MQ" target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400 text-sm underline font-medium block mb-2 break-all hover:text-sky-700">
                    https://www.opendrive.com/files/MTJfMTkzOTExNF9BcTM0MQ
                 </a>
               </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center border border-slate-200 dark:border-slate-600">3</div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase mb-1">Get Direct Link</h4>
                 <p className="text-sm text-slate-600 dark:text-slate-400">Right click on the file in Open Drive, select <strong>'Links'</strong>, then copy the <strong>'Direct Link (streaming)'</strong>.</p>
               </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center border border-sky-200 dark:border-sky-800">4</div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase mb-1">Enter Details & Save</h4>
                 <div className="flex gap-2">
                   <input 
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                      placeholder="Paste 'Direct Link (streaming)' here..."
                      value={formData.audioUrl} 
                      onChange={e => setFormData({...formData, audioUrl: e.target.value})} 
                    />
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-8 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6">
             <button 
               type="button" 
               onClick={onCancel} 
               disabled={isProcessing}
               className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={isProcessing}
               className="px-6 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 shadow-sm uppercase tracking-wide flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isProcessing && (
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               )}
               {isProcessing ? 'Saving...' : 'Save Sermon'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
