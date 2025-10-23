export const exportToCSV = (data: any[], filename = 'report.csv') => {
const csvContent = [Object.keys(data[0]).join(','), ...data.map((r) => Object.values(r).join(','))].join('\n');
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = filename;
link.click();
};
