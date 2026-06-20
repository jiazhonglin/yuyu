// 本地存储管理模块
const STORAGE_KEY = 'blood_glucose_records';

export function getRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function addRecord(record) {
  const records = getRecords();
  record.id = Date.now().toString();
  record.createdAt = new Date().toISOString();
  records.push(record);
  saveRecords(records);
  return record;
}

export function deleteRecord(id) {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  saveRecords(filtered);
}

export function updateRecord(id, updates) {
  const records = getRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    saveRecords(records);
  }
}

export function getRecordsByDate(date) {
  const records = getRecords();
  return records.filter(r => r.date === date);
}

export function getRecordsByDateRange(startDate, endDate) {
  const records = getRecords();
  return records.filter(r => r.date >= startDate && r.date <= endDate);
}

// 获取统计数据
export function getStats(records) {
  if (records.length === 0) {
    return { avg: 0, max: 0, min: 0, count: 0, normalRate: 0 };
  }
  
  const values = records.map(r => parseFloat(r.value));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const normalCount = values.filter(v => v >= 3.9 && v <= 7.8).length;
  const normalRate = (normalCount / values.length) * 100;
  
  return {
    avg: avg.toFixed(1),
    max: max.toFixed(1),
    min: min.toFixed(1),
    count: values.length,
    normalRate: normalRate.toFixed(0)
  };
}

// 导出数据
export function exportData() {
  const records = getRecords();
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blood_glucose_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 导入数据
export function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data)) {
      saveRecords(data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
