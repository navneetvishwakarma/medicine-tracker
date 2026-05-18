import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { DateRange, DoseLog, GridRow, Medicine } from '@/types'

export function downloadPDF(
  gridRows: GridRow[],
  patientName: string,
  { from, to }: DateRange,
) {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    doc.setFontSize(14)
    doc.text(`${patientName} — Medicine Tracker`, 14, 14)
    doc.setFontSize(10)
    doc.text(`Period: ${from} to ${to}`, 14, 22)

    const dates = Object.keys(gridRows[0]?.cells ?? {})
    const compact = dates.length > 14
    const headers = dates.map((d) => (compact ? d.slice(8) : d.slice(5)))

    autoTable(doc, {
      startY: 28,
      head: [['Medicine', 'Dosage', ...headers]],
      body: gridRows.map((r) => [r.medicineName, r.dosage, ...dates.map((d) => r.cells[d])]),
      styles: { fontSize: 8, cellPadding: compact ? 1 : 2 },
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: compact ? 14 : 20 } },
    })

    doc.save(`medicine-log-${from}-${to}.pdf`)
  } catch (err) {
    console.error('PDF export failed:', err)
    throw err
  }
}

export function downloadExcel(
  medicines: Medicine[],
  logs: DoseLog[],
  gridRows: GridRow[],
  patientName: string,
  { from, to }: DateRange,
) {
  try {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Raw log
    const logRows = logs.map((l) => ({
      Date: l.scheduledDate,
      Medicine: medicines.find((m) => m.id === l.medicineId)?.name ?? l.medicineId,
      'Time Slot': l.scheduledTime,
      Status: l.status,
      'Marked At': l.markedAt ?? '',
      Note: l.note ?? '',
    }))
    const ws1 = XLSX.utils.json_to_sheet(logRows)
    XLSX.utils.book_append_sheet(wb, ws1, 'Log')

    // Sheet 2: Summary grid
    const dates = Object.keys(gridRows[0]?.cells ?? {})
    const gridData = [
      [`${patientName} — ${from} to ${to}`, ...Array(dates.length + 1).fill('')],
      ['Medicine', 'Dosage', ...dates.map((d) => d.slice(5))],
      ...gridRows.map((r) => [r.medicineName, r.dosage, ...dates.map((d) => r.cells[d])]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(gridData)
    XLSX.utils.book_append_sheet(wb, ws2, 'Grid')

    XLSX.writeFile(wb, `medicine-log-${from}-${to}.xlsx`)
  } catch (err) {
    console.error('Excel export failed:', err)
    throw err
  }
}
