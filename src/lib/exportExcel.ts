import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Reading, DashboardData, Cycle, UserProfile } from '../types';

export const exportToExcel = async (readings: Reading[], dashboard: DashboardData | null, user: UserProfile | null = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TensioTrack';
  workbook.lastModifiedBy = 'TensioTrack';
  workbook.created = new Date();

  // --- Estilos Comunes ---
  const colors = {
    primary: 'FF4F46E5', // Indigo-600
    secondary: 'FF334155', // Slate-700
    success: 'FF16A34A', // Green-600
    warning: 'FFD97706', // Amber-600
    danger: 'FFDC2626', // Red-600
    info: 'FF0284C7', // Sky-600
    light: 'FFF1F5F9', // Slate-100
    white: 'FFFFFFFF',
    border: 'FFCBD5E1' // Slate-300
  };

  const titleStyle: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  };

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.secondary } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { argb: colors.border } },
      left: { style: 'thin', color: { argb: colors.border } },
      bottom: { style: 'medium', color: { argb: colors.border } },
      right: { style: 'thin', color: { argb: colors.border } }
    }
  };

  const cellStyle: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 10, color: { argb: colors.secondary } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: {
      bottom: { style: 'thin', color: { argb: colors.light } }
    }
  };

  const kpiLabelStyle: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.secondary } },
    alignment: { vertical: 'middle', horizontal: 'left' }
  };

  const kpiValueStyle: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: colors.primary } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  };

  // ==========================================
  // SHEET 1: DASHBOARD & RESUMEN
  // ==========================================
  const dashSheet = workbook.addWorksheet('Dashboard', {
    views: [{ showGridLines: false }]
  });

  dashSheet.getColumn('A').width = 25;
  dashSheet.getColumn('B').width = 15;
  dashSheet.getColumn('C').width = 5;
  dashSheet.getColumn('D').width = 25;
  dashSheet.getColumn('E').width = 15;

  // Título
  dashSheet.mergeCells('A1:E2');
  const dashTitle = dashSheet.getCell('A1');
  dashTitle.value = 'TensioTrack - Resumen Ejecutivo AMPA';
  dashTitle.style = titleStyle;

  // KPIs Principales
  dashSheet.addRow([]);
  
  let currentRow = 4;

  // Perfil del Paciente (Si existe)
  if (user && (user.age || user.weight || user.height)) {
    dashSheet.addRow(['PERFIL DEL PACIENTE']);
    dashSheet.mergeCells(`A${currentRow}:E${currentRow}`);
    dashSheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: colors.primary } };
    
    dashSheet.addRow(['Edad', user.age || '-', '', 'Sexo', user.sex === 'male' ? 'Hombre' : user.sex === 'female' ? 'Mujer' : user.sex || '-']);
    dashSheet.addRow(['Peso (kg)', user.weight || '-', '', 'Altura (cm)', user.height || '-']);
    
    const imc = user.weight && user.height ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : '-';
    dashSheet.addRow(['IMC', imc, '', 'Nivel Actividad', user.activityLevel || '-']);
    
    const conditions = [
      user.isSmoker ? 'Fumador' : null,
      user.hasDiabetes ? 'Diabetes' : null,
      user.isHypertensiveMedicated ? 'Medicado HTA' : null
    ].filter(Boolean).join(', ') || 'Ninguna';
    
    dashSheet.addRow(['Condiciones', conditions]);
    dashSheet.mergeCells(`B${dashSheet.lastRow!.number}:E${dashSheet.lastRow!.number}`);
    
    // Estilos para el perfil
    for (let i = currentRow; i <= dashSheet.lastRow!.number; i++) {
      dashSheet.getRow(i).eachCell(c => {
        if (c.address.startsWith('A') || c.address.startsWith('D')) c.style = kpiLabelStyle;
        else c.style = cellStyle;
      });
    }
    dashSheet.addRow([]);
    currentRow = dashSheet.lastRow!.number + 1;
  }

  dashSheet.addRow(['INDICADORES CLAVE (KPIs)']);
  dashSheet.mergeCells(`A${currentRow}:E${currentRow}`);
  dashSheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: colors.primary } };

  const stats = dashboard?.stats;
  
  // Fila 1 KPIs
  const kpiRow1 = dashSheet.addRow(['Media Global PAS', stats?.finalAverage?.systolic || '-', '', 'Media Global PAD', stats?.finalAverage?.diastolic || '-']);
  kpiRow1.height = 30;
  kpiRow1.getCell(1).style = kpiLabelStyle;
  kpiRow1.getCell(2).style = kpiValueStyle;
  kpiRow1.getCell(4).style = kpiLabelStyle;
  kpiRow1.getCell(5).style = kpiValueStyle;

  // Fila 2 KPIs
  const kpiRow2 = dashSheet.addRow(['Media Mañana (PAS/PAD)', `${stats?.periodAverages.morning?.systolic || '-'}/${stats?.periodAverages.morning?.diastolic || '-'}`, '', 'Media Noche (PAS/PAD)', `${stats?.periodAverages.evening?.systolic || '-'}/${stats?.periodAverages.evening?.diastolic || '-'}`]);
  kpiRow2.height = 30;
  kpiRow2.getCell(1).style = kpiLabelStyle;
  kpiRow2.getCell(2).style = kpiValueStyle;
  kpiRow2.getCell(4).style = kpiLabelStyle;
  kpiRow2.getCell(5).style = kpiValueStyle;

  // Fila 3 KPIs
  const kpiRow3 = dashSheet.addRow(['Total de Lecturas', readings.length, '', 'Días en el Ciclo Actual', stats?.daysCount || 0]);
  kpiRow3.height = 30;
  kpiRow3.getCell(1).style = kpiLabelStyle;
  kpiRow3.getCell(2).style = kpiValueStyle;
  kpiRow3.getCell(4).style = kpiLabelStyle;
  kpiRow3.getCell(5).style = kpiValueStyle;

  // Espaciado
  dashSheet.addRow([]);
  const interpretationRow = dashSheet.addRow(['Interpretación Médica (Guía Rápida)']);
  dashSheet.mergeCells(`A${interpretationRow.number}:E${interpretationRow.number}`);
  interpretationRow.getCell(1).font = { size: 12, bold: true, color: { argb: colors.secondary } };

  dashSheet.addRow(['Categoría', 'Rango PAS', '', 'Rango PAD', 'Estado']);
  const guideHeaderRow = dashSheet.lastRow!;
  guideHeaderRow.eachCell(c => c.style = headerStyle);

  const guideData = [
    ['Óptima', '< 120', '', '< 80', 'Normal'],
    ['Normal', '120 - 129', '', '80 - 84', 'Normal'],
    ['Normal-Alta', '130 - 134', '', '85 - 89', 'Alerta'],
    ['Hipertensión G1', '135 - 159', '', '90 - 99', 'Peligro'],
    ['Hipertensión G2+', '≥ 160', '', '≥ 100', 'Peligro'],
  ];

  guideData.forEach((data, i) => {
    const row = dashSheet.addRow(data);
    row.eachCell(c => c.style = cellStyle);
    if (i >= 2) row.getCell(5).font = { bold: true, color: { argb: i === 2 ? colors.warning : colors.danger } };
    else row.getCell(5).font = { bold: true, color: { argb: colors.success } };
  });

  // ==========================================
  // SHEET 2: CICLOS HISTÓRICOS
  // ==========================================
  if (stats?.historicalCycles && stats.historicalCycles.length > 0) {
    const cycleSheet = workbook.addWorksheet('Ciclos Históricos');
    cycleSheet.columns = [
      { header: 'Inicio', key: 'start', width: 15 },
      { header: 'Fin', key: 'end', width: 15 },
      { header: 'Media PAS', key: 'sys', width: 15 },
      { header: 'Media PAD', key: 'dia', width: 15 },
      { header: 'Media Mañana', key: 'morning', width: 20 },
      { header: 'Media Noche', key: 'evening', width: 20 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    cycleSheet.getRow(1).eachCell(c => c.style = headerStyle);

    stats.historicalCycles.forEach(cycle => {
      const row = cycleSheet.addRow({
        start: new Date(cycle.startDate).toLocaleDateString('es-ES'),
        end: new Date(cycle.endDate).toLocaleDateString('es-ES'),
        sys: cycle.finalAverage?.systolic || '-',
        dia: cycle.finalAverage?.diastolic || '-',
        morning: cycle.averages.morning ? `${cycle.averages.morning.systolic}/${cycle.averages.morning.diastolic}` : '-',
        evening: cycle.averages.evening ? `${cycle.averages.evening.systolic}/${cycle.averages.evening.diastolic}` : '-',
        status: (cycle.finalAverage?.systolic || 0) >= 135 || (cycle.finalAverage?.diastolic || 0) >= 85 ? 'Elevada' : 'Normal'
      });

      row.eachCell((cell, colNumber) => {
        cell.style = cellStyle;
        if (colNumber === 7) {
          cell.font = { bold: true, color: { argb: cell.value === 'Elevada' ? colors.danger : colors.success } };
        }
      });
    });
  }

  // ==========================================
  // SHEET 3: HISTORIAL DETALLADO
  // ==========================================
  const historySheet = workbook.addWorksheet('Historial Detallado', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  historySheet.columns = [
    { header: 'Fecha', key: 'date', width: 15 },
    { header: 'Hora', key: 'time', width: 12 },
    { header: 'Sesión', key: 'session', width: 15 },
    { header: 'Lectura', key: 'order', width: 10 },
    { header: 'Sistólica (PAS)', key: 'sys', width: 18 },
    { header: 'Diastólica (PAD)', key: 'dia', width: 18 },
    { header: 'Pulso (PPM)', key: 'hr', width: 15 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Notas', key: 'notes', width: 40 }
  ];

  historySheet.getRow(1).height = 25;
  historySheet.getRow(1).eachCell(c => c.style = headerStyle);

  // Ordenar lecturas
  const sortedReadings = [...readings].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  sortedReadings.forEach(reading => {
    const dateObj = new Date(reading.recordedAt);
    const row = historySheet.addRow({
      date: dateObj.toLocaleDateString('es-ES'),
      time: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      session: reading.slot === 'morning' ? 'Mañana' : 'Noche',
      order: reading.order,
      sys: reading.systolic,
      dia: reading.diastolic,
      hr: reading.heartRate || '-',
      category: reading.category || '-',
      notes: reading.notes || ''
    });

    row.eachCell((cell, colNumber) => {
      cell.style = cellStyle;
      
      // Colores de alerta profesional
      if (colNumber === 5) { // PAS
        if (reading.systolic >= 140) cell.font = { bold: true, color: { argb: colors.danger } };
        else if (reading.systolic >= 130) cell.font = { bold: true, color: { argb: colors.warning } };
        else if (reading.systolic < 100) cell.font = { bold: true, color: { argb: colors.info } };
      }
      if (colNumber === 6) { // PAD
        if (reading.diastolic >= 90) cell.font = { bold: true, color: { argb: colors.danger } };
        else if (reading.diastolic >= 80) cell.font = { bold: true, color: { argb: colors.warning } };
        else if (reading.diastolic < 60) cell.font = { bold: true, color: { argb: colors.info } };
      }
    });
  });

  // Añadir AutoFiltro a la tabla de historial
  historySheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 9 }
  };

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `TensioTrack_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};

