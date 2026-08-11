import { FormEvent, useState } from 'react';
import { Haptics } from '../lib/haptics';
import { MarketplaceOperationError, submitReview } from '../lib/applications';

interface ReviewFormProps {
  gigId: string;
  fromUid: string;
  toUid: string;
  compact?: boolean;
}

export function ReviewForm({ gigId, fromUid, toUid, compact = false }: ReviewFormProps) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      await submitReview({ gigId, fromUid, toUid, score, comment });
      Haptics.success();
      setFeedback({ type: 'success', message: 'Review recorded.' });
    } catch (error) {
      Haptics.error();
      setFeedback({
        type: 'error',
        message: error instanceof MarketplaceOperationError
          ? error.message
          : 'EDGE could not save this review. Try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`rounded-[2rem] border border-black/5 bg-white ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="flex items-center justify-between gap-4">
        <label className="col-header opacity-100 text-black" htmlFor={`review-score-${gigId}`}>Post-gig rating</label>
        <select
          id={`review-score-${gigId}`}
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
          className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-black"
        >
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={compact ? 2 : 3}
        placeholder="Share concise, factual feedback..."
        className="w-full rounded-2xl bg-slate-50 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-black"
      />
      {feedback && (
        <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`text-xs font-semibold ${feedback.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.message}
        </p>
      )}
      <button disabled={saving || feedback?.type === 'success'} type="submit" className="w-full rounded-2xl bg-black p-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40">
        {saving ? 'Recording...' : feedback?.type === 'success' ? 'Review recorded' : 'Submit review'}
      </button>
    </form>
  );
}
