import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let chartInstance = null;

export function renderChart(canvasId, records, days = 7) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  // 按日期分组并计算每天的平均值
  const groupedByDate = {};
  records.forEach(r => {
    if (!groupedByDate[r.date]) {
      groupedByDate[r.date] = [];
    }
    groupedByDate[r.date].push(parseFloat(r.value));
  });

  // 获取最近 N 天的数据
  const dates = Object.keys(groupedByDate).sort().slice(-days);
  const avgValues = dates.map(date => {
    const vals = groupedByDate[date];
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  });

  const labels = dates.map(d => {
    const parts = d.split('-');
    return `${parts[1]}/${parts[2]}`;
  });

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '日均血糖 (mmol/L)',
        data: avgValues,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: avgValues.map(v => {
          const val = parseFloat(v);
          if (val < 3.9) return '#3b82f6';
          if (val <= 7.8) return '#10b981';
          if (val <= 11.1) return '#f59e0b';
          return '#ef4444';
        }),
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const val = parseFloat(context.raw);
              if (val < 3.9) return '⚠️ 偏低';
              if (val <= 6.1) return '✅ 正常（空腹）';
              if (val <= 7.8) return '✅ 正常（餐后）';
              if (val <= 11.1) return '⚠️ 偏高';
              return '🚨 过高';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 2,
          max: 20,
          grid: {
            color: (ctx) => {
              if (ctx.tick.value === 3.9 || ctx.tick.value === 7.8) {
                return 'rgba(16, 185, 129, 0.3)';
              }
              return 'rgba(0, 0, 0, 0.05)';
            }
          },
          ticks: {
            callback: (value) => value + ' mmol/L'
          }
        }
      },
      annotation: {
        annotations: {
          normalRange: {
            type: 'box',
            yMin: 3.9,
            yMax: 7.8,
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }
        }
      }
    }
  });
}

export function renderDistributionChart(canvasId, records) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const values = records.map(r => parseFloat(r.value));
  const low = values.filter(v => v < 3.9).length;
  const normal = values.filter(v => v >= 3.9 && v <= 7.8).length;
  const high = values.filter(v => v > 7.8 && v <= 11.1).length;
  const veryHigh = values.filter(v => v > 11.1).length;

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['偏低 (<3.9)', '正常 (3.9-7.8)', '偏高 (7.8-11.1)', '过高 (>11.1)'],
      datasets: [{
        data: [low, normal, high, veryHigh],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
          }
        }
      }
    }
  });
}

export function renderMealChart(canvasId, records) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const mealTypes = { '空腹': [], '早餐后': [], '午餐后': [], '晚餐后': [], '睡前': [], '其他': [] };
  
  records.forEach(r => {
    const type = r.mealType || '其他';
    if (mealTypes[type]) {
      mealTypes[type].push(parseFloat(r.value));
    }
  });

  const labels = Object.keys(mealTypes).filter(k => mealTypes[k].length > 0);
  const avgData = labels.map(k => {
    const vals = mealTypes[k];
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  });

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '平均血糖 (mmol/L)',
        data: avgData,
        backgroundColor: labels.map((_, i) => {
          const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
          return colors[i % colors.length];
        }),
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => value + ' mmol/L'
          }
        }
      }
    }
  });
}
