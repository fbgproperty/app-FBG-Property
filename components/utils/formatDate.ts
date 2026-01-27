export function formatDateTime(value?: string) {
    if (!value) return '--';
  
    const d = new Date(value);
  
    const dd = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
  
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
  
    return `${dd}/${MM}/${yy} ${HH}:${mm}`;
  }