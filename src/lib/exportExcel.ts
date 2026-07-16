import type { ProblemSet } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';
import { saveFile } from './download';
import { stripMathDelimiters } from './exportText';

export type ExcelMode = 'questions' | 'answers' | 'both';

export const EXCEL_MODE_LABEL: Record<ExcelMode, string> = {
  questions: '문제만',
  answers: '답만',
  both: '문제 + 답',
};

const MAX_CHOICES = 5;

function buildRows(set: ProblemSet, mode: ExcelMode): Record<string, string | number>[] {
  return set.problems.map((p, i) => {
    const row: Record<string, string | number> = {
      번호: i + 1,
      유형: PROBLEM_TYPE_LABEL[p.type],
    };
    if (mode !== 'answers') {
      row['문제'] = stripMathDelimiters(p.question);
      for (let c = 0; c < MAX_CHOICES; c++) {
        row[`보기${c + 1}`] = p.choices?.[c] ? stripMathDelimiters(p.choices[c]) : '';
      }
    }
    if (mode !== 'questions') {
      row['정답'] = stripMathDelimiters(p.answer);
      row['풀이'] = stripMathDelimiters(p.explanation);
    }
    return row;
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').slice(0, 60);
}

export async function exportProblemSetToExcel(set: ProblemSet, mode: ExcelMode): Promise<void> {
  // xlsx는 용량이 커서 실제 내보내기 시점에만 로드
  const XLSX = await import('xlsx');
  const rows = buildRows(set, mode);
  const sheet = XLSX.utils.json_to_sheet(rows);

  // 열 너비: 번호/유형은 좁게, 문제/풀이는 넓게
  const headers = Object.keys(rows[0] ?? {});
  sheet['!cols'] = headers.map((h) => {
    if (h === '번호') return { wch: 6 };
    if (h === '유형') return { wch: 8 };
    if (h === '문제' || h === '풀이') return { wch: 60 };
    if (h === '정답') return { wch: 20 };
    return { wch: 18 };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, EXCEL_MODE_LABEL[mode]);

  const date = new Date(set.createdAt).toISOString().slice(0, 10);
  const fileName = sanitizeFileName(
    `MathGen_${set.level}_${set.topic}_${EXCEL_MODE_LABEL[mode]}_${date}`,
  );
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await saveFile(blob, `${fileName}.xlsx`);
}
