import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ValidRow {
  empCode: string;
  name: string;
  departmentId: string;
  salary: number;
  joinDate: string;
  status: string;
  lastUpdatedDate: string;
}

interface InvalidRow {
  rowNumber: number;
  rawData: Record<string, unknown>;
  reasons: string[];
}

type Step = 'upload' | 'preview' | 'committing';

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<Step>('upload');
  const [validRows, setValidRows] = useState<ValidRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setStep('upload');
    setValidRows([]);
    setInvalidRows([]);
    setError('');
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select an .xlsx file');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/employees/import', fd);
      setValidRows(res.data.validRows || []);
      setInvalidRows(res.data.invalidRows || []);
      setStep('preview');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    setStep('committing');
    setIsLoading(true);
    try {
      const res = await api.post('/employees/import/commit', { validRows });
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Imported ${res.data.upserted} employees`);
      handleClose();
    } catch {
      toast.error('Import failed');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Employees from Excel</DialogTitle>
        </DialogHeader>
        {step === 'upload' && (
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Upload an <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">.xlsx</code> file with columns: ID, Name, Department, Salary, Join Date, Status, Last Updated Date.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors">
              <Upload className="mx-auto mb-2 text-slate-400" size={32} />
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                id="xlsx-input"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
              />
              <label htmlFor="xlsx-input" className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
                Click to select file
              </label>
              {fileName && (
                <p className="mt-2 text-xs font-semibold text-slate-700 bg-slate-100 inline-block px-2.5 py-1 rounded">
                  {fileName}
                </p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? 'Parsing…' : 'Parse File'}
              </Button>
            </DialogFooter>
          </div>
        )}
        {step === 'preview' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg font-medium border border-green-200">
                <CheckCircle2 size={16} />
                {validRows.length} rows ready to import
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg font-medium border border-amber-200">
                  <AlertCircle size={16} />
                  {invalidRows.length} rows with errors
                </div>
              )}
            </div>
            {invalidRows.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Rows with errors (will NOT be imported):</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {invalidRows.map((r) => (
                    <div key={r.rowNumber} className="text-xs border border-amber-200 bg-amber-50 rounded-lg p-3">
                      <span className="font-semibold text-amber-900">Row {r.rowNumber}:</span>{' '}
                      <span className="text-amber-800">{r.reasons.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleCommit} disabled={isLoading || validRows.length === 0}>
                {isLoading ? 'Importing…' : `Confirm Import (${validRows.length} rows)`}
              </Button>
            </DialogFooter>
          </div>
        )}
        {step === 'committing' && (
          <div className="py-8 text-center text-sm text-slate-500">Importing employees…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
