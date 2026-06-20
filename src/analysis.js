// 血糖分析模块
export function analyzeRecords(records) {
  if (records.length === 0) {
    return { summary: '暂无数据，请先添加血糖记录。', suggestions: [], trend: 'none' };
  }

  const values = records.map(r => parseFloat(r.value));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  const suggestions = [];
  let summary = '';
  let trend = 'stable';

  // 整体水平分析
  if (avg < 3.9) {
    summary = '⚠️ 您的平均血糖偏低，存在低血糖风险。';
    suggestions.push('建议少量多餐，避免长时间空腹');
    suggestions.push('随身携带含糖食品以备不时之需');
    suggestions.push('建议咨询医生调整用药方案');
  } else if (avg <= 6.1) {
    summary = '✅ 您的平均血糖处于理想的空腹范围，控制得很好！';
    suggestions.push('继续保持当前的饮食和运动习惯');
    suggestions.push('定期监测以保持良好状态');
  } else if (avg <= 7.8) {
    summary = '✅ 您的平均血糖在正常范围内（餐后水平），整体控制良好。';
    suggestions.push('注意餐后血糖监测');
    suggestions.push('保持均衡饮食，适量运动');
  } else if (avg <= 11.1) {
    summary = '⚠️ 您的平均血糖偏高，需要加强管理。';
    suggestions.push('减少精制碳水化合物的摄入');
    suggestions.push('增加膳食纤维摄入，如蔬菜和粗粮');
    suggestions.push('餐后适当散步30分钟');
    suggestions.push('建议咨询医生是否需要调整治疗方案');
  } else {
    summary = '🚨 您的平均血糖明显偏高，请尽快就医。';
    suggestions.push('立即联系您的主治医生');
    suggestions.push('严格控制饮食，避免高糖食物');
    suggestions.push('规律监测血糖，记录变化');
    suggestions.push('注意饮水，避免脱水');
  }

  // 波动分析
  const range = max - min;
  if (range > 8) {
    suggestions.push('⚡ 血糖波动较大（波幅 ' + range.toFixed(1) + ' mmol/L），建议关注进食节奏和种类');
  } else if (range > 5) {
    suggestions.push('📊 血糖有一定波动（波幅 ' + range.toFixed(1) + ' mmol/L），注意规律进餐');
  }

  // 趋势分析（最近7条记录 vs 之前7条）
  if (records.length >= 14) {
    const recent = records.slice(-7).map(r => parseFloat(r.value));
    const previous = records.slice(-14, -7).map(r => parseFloat(r.value));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    const diff = recentAvg - previousAvg;
    if (diff > 1) {
      trend = 'rising';
      suggestions.push('📈 近期血糖有上升趋势（上升 ' + diff.toFixed(1) + ' mmol/L），请注意饮食控制');
    } else if (diff < -1) {
      trend = 'falling';
      suggestions.push('📉 近期血糖有下降趋势（下降 ' + Math.abs(diff).toFixed(1) + ' mmol/L），控制有改善');
    } else {
      trend = 'stable';
      suggestions.push('📊 近期血糖趋势平稳');
    }
  }

  // 餐时分析
  const mealAnalysis = analyzeMealPatterns(records);
  if (mealAnalysis) {
    suggestions.push(mealAnalysis);
  }

  // 饮食关联分析
  const dietAnalysis = analyzeDietPatterns(records);
  dietAnalysis.forEach(d => suggestions.push(d));

  return { summary, suggestions, trend, avg: avg.toFixed(1), max: max.toFixed(1), min: min.toFixed(1) };
}

function analyzeMealPatterns(records) {
  const mealGroups = {};
  records.forEach(r => {
    const type = r.mealType || '其他';
    if (!mealGroups[type]) mealGroups[type] = [];
    mealGroups[type].push(parseFloat(r.value));
  });

  let highestMeal = '';
  let highestAvg = 0;

  Object.entries(mealGroups).forEach(([meal, values]) => {
    if (values.length >= 3) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > highestAvg) {
        highestAvg = avg;
        highestMeal = meal;
      }
    }
  });

  if (highestMeal && highestAvg > 7.8) {
    return `🍽️ "${highestMeal}"时段血糖偏高（平均 ${highestAvg.toFixed(1)} mmol/L），建议重点关注该时段的饮食`;
  }
  return null;
}

function analyzeDietPatterns(records) {
  const results = [];
  const recordsWithNotes = records.filter(r => r.note && r.note.trim());
  
  if (recordsWithNotes.length < 5) return results;

  // 简单的关键词匹配分析
  const highGlucoseRecords = recordsWithNotes.filter(r => parseFloat(r.value) > 7.8);
  const normalRecords = recordsWithNotes.filter(r => parseFloat(r.value) >= 3.9 && parseFloat(r.value) <= 7.8);
  
  if (highGlucoseRecords.length > 0) {
    const highFoods = extractCommonFoods(highGlucoseRecords);
    if (highFoods.length > 0) {
      results.push(`🔍 血糖偏高时常见的饮食关键词：${highFoods.join('、')}`);
    }
  }

  if (normalRecords.length > 0) {
    const goodFoods = extractCommonFoods(normalRecords);
    if (goodFoods.length > 0) {
      results.push(`✅ 血糖正常时常见的饮食关键词：${goodFoods.join('、')}`);
    }
  }

  return results;
}

function extractCommonFoods(records) {
  const foodKeywords = ['米饭', '面条', '面包', '水果', '蔬菜', '鸡蛋', '牛奶', '粥', 
    '饺子', '馒头', '包子', '红薯', '土豆', '肉', '鱼', '豆腐', '沙拉',
    '可乐', '果汁', '蛋糕', '饼干', '巧克力', '冰淇淋', '薯片', '烧烤',
    '火锅', '奶茶', '甜品', '糖', '粗粮', '燕麦', '全麦', '杂粮',
    '苹果', '香蕉', '葡萄', '西瓜', '橙子'];
  
  const allNotes = records.map(r => r.note).join(' ');
  const found = foodKeywords.filter(food => allNotes.includes(food));
  
  // 返回出现频率最高的前5个
  return found.slice(0, 5);
}

// 生成每日总结
export function generateDailySummary(records, date) {
  const dayRecords = records.filter(r => r.date === date);
  if (dayRecords.length === 0) return null;

  const values = dayRecords.map(r => parseFloat(r.value));
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const max = Math.max(...values).toFixed(1);
  const min = Math.min(...values).toFixed(1);
  const normalCount = values.filter(v => v >= 3.9 && v <= 7.8).length;

  let status = '良好';
  let emoji = '✅';
  if (parseFloat(avg) > 11.1) { status = '需要关注'; emoji = '🚨'; }
  else if (parseFloat(avg) > 7.8) { status = '偏高'; emoji = '⚠️'; }
  else if (parseFloat(avg) < 3.9) { status = '偏低'; emoji = '⚠️'; }

  return {
    date,
    count: dayRecords.length,
    avg,
    max,
    min,
    normalCount,
    normalRate: ((normalCount / values.length) * 100).toFixed(0),
    status,
    emoji,
    records: dayRecords
  };
}
