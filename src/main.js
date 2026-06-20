import './style.css';
import { getRecords, addRecord, deleteRecord, getStats, exportData, importData } from './storage.js';
import { renderChart, renderDistributionChart, renderMealChart } from './chart.js';
import { analyzeRecords, generateDailySummary } from './analysis.js';
import { isLoggedIn, login, logout, getCurrentUser } from './auth.js';

// 当前页面状态
let currentTab = 'record';

// 初始化应用
function init() {
  if (isLoggedIn()) {
    renderApp();
  } else {
    renderAuthPage();
  }
}

// =================== 登录页面 ===================
function renderAuthPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8 animate-fade-in">
          <div class="text-6xl mb-4">🩸</div>
          <h1 class="text-3xl font-bold text-gray-800">血糖记录助手</h1>
          <p class="text-gray-500 mt-2">记录每日血糖，守护您的健康</p>
        </div>

        <!-- 登录卡片 -->
        <div class="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          <h2 class="text-xl font-semibold text-gray-800 text-center mb-6">请登录</h2>

          <form onsubmit="handleAuth(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="flex items-center gap-1">👤 账号</span>
              </label>
              <input type="text" id="authUsername" required autocomplete="username"
                placeholder="请输入账号"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="flex items-center gap-1">🔒 密码</span>
              </label>
              <input type="password" id="authPassword" required autocomplete="current-password"
                placeholder="请输入密码"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800" />
            </div>
            
            <!-- 错误提示 -->
            <div id="authError" class="hidden text-sm text-red-500 bg-red-50 p-3 rounded-lg"></div>

            <button type="submit" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:scale-[1.01]">
              🚀 登录
            </button>
          </form>
        </div>

        <p class="text-xs text-gray-400 text-center mt-6">数据安全保存在本地浏览器中</p>
      </div>
    </div>
  `;
}

function renderApp() {
  const app = document.getElementById('app');
  const username = getCurrentUser();
  app.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- 头部 -->
      <header class="text-center mb-8">
        <div class="flex items-center justify-between mb-4">
          <div></div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">👤 ${username}</span>
            <button onclick="handleLogout()" class="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1 rounded-lg hover:bg-red-50">
              退出登录
            </button>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <span class="text-4xl">🩸</span>
          <span>血糖记录助手</span>
        </h1>
        <p class="text-gray-500 mt-2">记录每日血糖，守护您的健康</p>
      </header>

      <!-- 导航标签 -->
      <nav class="flex bg-white rounded-xl shadow-sm mb-6 p-1 gap-1">
        <button onclick="switchTab('record')" class="tab-btn flex-1 py-3 px-4 rounded-lg font-medium transition-all ${currentTab === 'record' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}">
          📝 记录
        </button>
        <button onclick="switchTab('summary')" class="tab-btn flex-1 py-3 px-4 rounded-lg font-medium transition-all ${currentTab === 'summary' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}">
          📋 总结
        </button>
        <button onclick="switchTab('analysis')" class="tab-btn flex-1 py-3 px-4 rounded-lg font-medium transition-all ${currentTab === 'analysis' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}">
          📊 分析
        </button>
      </nav>

      <!-- 内容区域 -->
      <main id="content" class="animate-fade-in">
        ${renderTabContent()}
      </main>

      <!-- 底部操作 -->
      <footer class="mt-8 text-center">
        <div class="flex justify-center gap-3">
          <button onclick="handleExport()" class="text-sm text-gray-500 hover:text-indigo-500 transition-colors">
            📤 导出数据
          </button>
          <span class="text-gray-300">|</span>
          <label class="text-sm text-gray-500 hover:text-indigo-500 transition-colors cursor-pointer">
            📥 导入数据
            <input type="file" accept=".json" onchange="handleImport(event)" class="hidden" />
          </label>
        </div>
        <p class="text-xs text-gray-400 mt-3">所有数据保存在本地浏览器中，不会上传到任何服务器</p>
      </footer>
    </div>
  `;

  // 如果在分析页面，需要延迟渲染图表
  if (currentTab === 'analysis') {
    setTimeout(() => renderAnalysisCharts(), 100);
  }
}

function renderTabContent() {
  switch (currentTab) {
    case 'record': return renderRecordTab();
    case 'summary': return renderSummaryTab();
    case 'analysis': return renderAnalysisTab();
    default: return '';
  }
}

// =================== 记录页面 ===================
function renderRecordTab() {
  const today = new Date().toISOString().split('T')[0];
  const records = getRecords();
  const recentRecords = records.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  }).slice(0, 20);

  return `
    <!-- 添加记录表单 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">添加血糖记录</h2>
      <form id="recordForm" onsubmit="handleAddRecord(event)" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input type="date" id="recordDate" value="${today}" required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">时间</label>
            <input type="time" id="recordTime" value="${new Date().toTimeString().slice(0, 5)}" required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">血糖值 (mmol/L)</label>
            <input type="number" id="recordValue" step="0.1" min="1" max="35" required placeholder="例如：5.6"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">测量时段</label>
            <select id="mealType" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition">
              <option value="空腹">空腹</option>
              <option value="早餐后">早餐后</option>
              <option value="午餐后">午餐后</option>
              <option value="晚餐后">晚餐后</option>
              <option value="睡前">睡前</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">饮食备注</label>
          <textarea id="recordNote" rows="2" placeholder="记录今天吃了什么，例如：早餐吃了全麦面包和鸡蛋..."
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"></textarea>
        </div>
        <button type="submit" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-lg transition-colors shadow-sm hover:shadow-md">
          ➕ 添加记录
        </button>
      </form>
    </div>

    <!-- 快速统计 -->
    ${renderQuickStats(records)}

    <!-- 最近记录 -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">最近记录</h2>
      ${recentRecords.length === 0 ? 
        '<p class="text-gray-400 text-center py-8">还没有记录，开始添加吧 ✨</p>' :
        `<div class="space-y-3">${recentRecords.map(r => renderRecordItem(r)).join('')}</div>`
      }
    </div>
  `;
}

function renderQuickStats(records) {
  if (records.length === 0) return '';
  const stats = getStats(records);
  
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-indigo-600">${stats.avg}</div>
        <div class="text-xs text-gray-500 mt-1">平均血糖</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-red-500">${stats.max}</div>
        <div class="text-xs text-gray-500 mt-1">最高值</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-blue-500">${stats.min}</div>
        <div class="text-xs text-gray-500 mt-1">最低值</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-green-500">${stats.normalRate}%</div>
        <div class="text-xs text-gray-500 mt-1">达标率</div>
      </div>
    </div>
  `;
}

function renderRecordItem(record) {
  const value = parseFloat(record.value);
  let colorClass = 'glucose-normal';
  let label = '正常';
  if (value < 3.9) { colorClass = 'glucose-low'; label = '偏低'; }
  else if (value > 11.1) { colorClass = 'glucose-very-high'; label = '过高'; }
  else if (value > 7.8) { colorClass = 'glucose-high'; label = '偏高'; }

  return `
    <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all animate-slide-in">
      <div class="flex items-center gap-4">
        <div class="text-center">
          <div class="text-xs text-gray-400">${record.date}</div>
          <div class="text-sm font-medium text-gray-600">${record.time || ''}</div>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-gray-800">${record.value}</span>
            <span class="text-xs text-gray-500">mmol/L</span>
            <span class="text-xs px-2 py-0.5 rounded-full ${colorClass}">${label}</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">${record.mealType || '其他'}</span>
            ${record.note ? `<span class="text-xs text-gray-400 truncate max-w-48">🍽️ ${record.note}</span>` : ''}
          </div>
        </div>
      </div>
      <button onclick="handleDelete('${record.id}')" class="text-gray-300 hover:text-red-500 transition-colors p-2" title="删除">
        🗑️
      </button>
    </div>
  `;
}

// =================== 总结页面 ===================
function renderSummaryTab() {
  const records = getRecords();
  const today = new Date();
  
  // 生成最近7天的每日总结
  const summaries = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const summary = generateDailySummary(records, dateStr);
    if (summary) summaries.push(summary);
  }

  // 本周统计
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekRecords = records.filter(r => r.date >= weekStart.toISOString().split('T')[0]);
  const weekStats = getStats(weekRecords);

  return `
    <!-- 本周概览 -->
    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
      <h2 class="text-lg font-semibold mb-4">📊 本周概览</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-3xl font-bold">${weekStats.count}</div>
          <div class="text-indigo-100 text-sm">测量次数</div>
        </div>
        <div>
          <div class="text-3xl font-bold">${weekStats.avg}</div>
          <div class="text-indigo-100 text-sm">平均血糖</div>
        </div>
        <div>
          <div class="text-3xl font-bold">${weekStats.normalRate}%</div>
          <div class="text-indigo-100 text-sm">达标率</div>
        </div>
        <div>
          <div class="text-3xl font-bold">${weekStats.max - weekStats.min > 0 ? (weekStats.max - weekStats.min).toFixed(1) : '0'}</div>
          <div class="text-indigo-100 text-sm">波动幅度</div>
        </div>
      </div>
    </div>

    <!-- 每日总结列表 -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">每日总结</h2>
      ${summaries.length === 0 ? 
        '<p class="text-gray-400 text-center py-8">最近7天暂无记录数据</p>' :
        `<div class="space-y-4">${summaries.map(s => renderDaySummary(s)).join('')}</div>`
      }
    </div>
  `;
}

function renderDaySummary(summary) {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayOfWeek = dayNames[new Date(summary.date).getDay()];
  
  return `
    <div class="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">${summary.emoji}</span>
          <span class="font-medium text-gray-800">${summary.date}</span>
          <span class="text-xs text-gray-400">${dayOfWeek}</span>
        </div>
        <span class="text-sm px-3 py-1 rounded-full ${
          summary.status === '良好' ? 'bg-green-50 text-green-600' : 
          summary.status === '偏高' ? 'bg-yellow-50 text-yellow-600' : 
          'bg-red-50 text-red-600'
        }">${summary.status}</span>
      </div>
      <div class="grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <div class="font-semibold text-gray-700">${summary.avg}</div>
          <div class="text-xs text-gray-400">平均</div>
        </div>
        <div>
          <div class="font-semibold text-gray-700">${summary.max}</div>
          <div class="text-xs text-gray-400">最高</div>
        </div>
        <div>
          <div class="font-semibold text-gray-700">${summary.min}</div>
          <div class="text-xs text-gray-400">最低</div>
        </div>
        <div>
          <div class="font-semibold text-gray-700">${summary.count}次</div>
          <div class="text-xs text-gray-400">测量</div>
        </div>
      </div>
      ${summary.records.some(r => r.note) ? `
        <div class="mt-3 pt-3 border-t border-gray-50">
          <div class="text-xs text-gray-500">
            🍽️ 饮食记录：${summary.records.filter(r => r.note).map(r => r.note).join('；')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// =================== 分析页面 ===================
function renderAnalysisTab() {
  const records = getRecords();
  const analysis = analyzeRecords(records);

  return `
    <!-- AI 分析结果 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">🤖 智能分析</h2>
      ${records.length === 0 ? 
        '<p class="text-gray-400 text-center py-8">添加更多记录后即可获得分析结果</p>' :
        `
        <div class="bg-gray-50 rounded-xl p-4 mb-4">
          <p class="text-gray-700 font-medium">${analysis.summary}</p>
          <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>平均: ${analysis.avg} mmol/L</span>
            <span>最高: ${analysis.max} mmol/L</span>
            <span>最低: ${analysis.min} mmol/L</span>
          </div>
        </div>
        ${analysis.suggestions.length > 0 ? `
          <div class="space-y-2">
            <h3 class="text-sm font-medium text-gray-600">建议与提醒：</h3>
            ${analysis.suggestions.map(s => `
              <div class="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
                <span class="text-sm text-indigo-700">${s}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        `
      }
    </div>

    <!-- 趋势图表 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">📈 血糖趋势（最近30天）</h2>
      <div class="h-64">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <!-- 分布和餐时图表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">🎯 血糖分布</h2>
        <div class="h-56">
          <canvas id="distributionChart"></canvas>
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">🍽️ 各时段对比</h2>
        <div class="h-56">
          <canvas id="mealChart"></canvas>
        </div>
      </div>
    </div>

    <!-- 参考范围说明 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mt-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">📖 血糖参考范围</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span class="text-sm text-gray-700">偏低：< 3.9 mmol/L</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-lg bg-green-50">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="text-sm text-gray-700">正常空腹：3.9 - 6.1 mmol/L</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-lg bg-green-50">
          <div class="w-3 h-3 rounded-full bg-green-400"></div>
          <span class="text-sm text-gray-700">正常餐后：3.9 - 7.8 mmol/L</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span class="text-sm text-gray-700">偏高：7.8 - 11.1 mmol/L</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-lg bg-red-50">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="text-sm text-gray-700">过高：> 11.1 mmol/L</span>
        </div>
      </div>
    </div>
  `;
}

function renderAnalysisCharts() {
  const records = getRecords();
  if (records.length === 0) return;
  
  renderChart('trendChart', records, 30);
  renderDistributionChart('distributionChart', records);
  renderMealChart('mealChart', records);
}

// =================== 认证事件处理 ===================
window.handleAuth = function(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');

  const result = login(username, password);
  if (result.success) {
    showToast('✅ 登录成功，欢迎回来！');
    renderApp();
  } else {
    errorEl.textContent = '❌ ' + result.message;
    errorEl.classList.remove('hidden');
  }
};

window.handleLogout = function() {
  if (confirm('确定要退出登录吗？')) {
    logout();
    showToast('👋 已退出登录');
    renderAuthPage();
  }
};

// =================== 页面事件处理 ===================
window.switchTab = function(tab) {
  currentTab = tab;
  renderApp();
};

window.handleAddRecord = function(e) {
  e.preventDefault();
  
  const date = document.getElementById('recordDate').value;
  const time = document.getElementById('recordTime').value;
  const value = document.getElementById('recordValue').value;
  const mealType = document.getElementById('mealType').value;
  const note = document.getElementById('recordNote').value;

  if (!date || !value) return;

  addRecord({ date, time, value, mealType, note });
  
  // 重新渲染
  renderApp();
  
  // 显示成功提示
  showToast('✅ 记录已添加');
};

window.handleDelete = function(id) {
  if (confirm('确定要删除这条记录吗？')) {
    deleteRecord(id);
    renderApp();
    showToast('🗑️ 记录已删除');
  }
};

window.handleExport = function() {
  exportData();
  showToast('📤 数据已导出');
};

window.handleImport = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const success = importData(e.target.result);
    if (success) {
      renderApp();
      showToast('📥 数据导入成功');
    } else {
      showToast('❌ 导入失败，请检查文件格式');
    }
  };
  reader.readAsText(file);
};

// Toast 提示
function showToast(message) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification fixed top-4 right-4 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 启动应用
init();
