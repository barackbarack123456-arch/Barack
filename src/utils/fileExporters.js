const SEPARATOR = ',';

// Helper function to escape CSV fields
const escapeField = (field) => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  // If the field contains a comma, a quote, or a newline, enclose it in double quotes
  if (stringField.includes(SEPARATOR) || stringField.includes('"') || stringField.includes('\n')) {
    // Escape existing double quotes by doubling them
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

// Recursive function to flatten the hierarchy
const flattenHierarchy = (nodes, flattened = [], level = 0) => {
  nodes.forEach(node => {
    const indentedName = `${' '.repeat(level * 4)}${node.nombre}`;
    flattened.push({
      ...node,
      nombre: indentedName,
    });
    if (node.children && node.children.length > 0) {
      flattenHierarchy(node.children, flattened, level + 1);
    }
  });
  return flattened;
};

// Main function to export to CSV
export const exportToCSV = (hierarchy, fileName = 'sinoptico.csv') => {
  if (!hierarchy || hierarchy.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  // Define CSV headers
  const headers = ['Nombre', 'Código', 'Tipo', 'Peso', 'Medidas'];
  const flattenedData = flattenHierarchy(hierarchy);

  // Convert data to CSV format
  const csvRows = [
    headers.join(SEPARATOR),
    ...flattenedData.map(item =>
      [
        escapeField(item.nombre),
        escapeField(item.codigo),
        escapeField(item.type),
        escapeField(item.peso),
        escapeField(item.medidas)
      ].join(SEPARATOR)
    )
  ];

  const csvString = csvRows.join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Main function to export to PDF
export const exportToPDF = (hierarchy, fileName = 'sinoptico.pdf') => {
  if (!hierarchy || hierarchy.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const flattenedData = flattenHierarchy(hierarchy);

  const doc = new jsPDF();

  // Add a title to the document
  const rootProductName = hierarchy[0]?.nombre || 'Sinóptico';
  doc.text(`Jerarquía de Producto: ${rootProductName}`, 14, 20);

  // Define columns and rows for the table
  const tableColumn = ['Nombre', 'Código', 'Tipo', 'Peso', 'Medidas'];
  const tableRows = flattenedData.map(item => [
    item.nombre,
    item.codigo || 'N/A',
    item.type || 'N/A',
    item.peso || 'N/A',
    item.medidas || 'N/A'
  ]);

  // Create the table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133] }, // Custom header color
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 2,
    },
    // eslint-disable-next-line no-unused-vars
    didParseCell: function (data) {
        // Here we can style specific cells if needed
        // For example, we could try to handle indentation visually
        // This is complex, so for now we rely on the indented text
    }
  });

  // Save the PDF
  doc.save(fileName);
};
