import { useEffect, useRef, useState } from 'react';
import { EXCEL_MODE_LABEL, exportProblemSetToExcel, type ExcelMode } from '../lib/exportExcel';
import type { ProblemSet } from '../types';

const MODES: ExcelMode[] = ['questions', 'answers', 'both'];

/** Excel 내보내기 드롭다운 (문제만 / 답만 / 문제+답) */
export default function ExcelMenu({ set }: { set: ProblemSet }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function onExport(mode: ExcelMode) {
    setOpen(false);
    await exportProblemSetToExcel(set, mode);
  }

  return (
    <div className="dropdown" ref={ref}>
      <button className="btn-secondary" onClick={() => setOpen((v) => !v)}>
        📥 Excel 내보내기 ▾
      </button>
      {open && (
        <div className="dropdown-menu">
          {MODES.map((m) => (
            <button key={m} className="dropdown-item" onClick={() => onExport(m)}>
              {EXCEL_MODE_LABEL[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
