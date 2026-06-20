// 认证模块 - 固定账号密码验证
const SESSION_KEY = 'blood_glucose_session';

// 预设账号密码
const PRESET_USERNAME = 'yuyu';
const PRESET_PASSWORD = 'yuyu';

// 检查是否已登录
export function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

// 登录
export function login(username, password) {
  if (!username || !password) {
    return { success: false, message: '请输入账号密码' };
  }
  
  if (username !== PRESET_USERNAME) {
    return { success: false, message: '账号不正确' };
  }
  
  if (password !== PRESET_PASSWORD) {
    return { success: false, message: '密码不正确' };
  }
  
  sessionStorage.setItem(SESSION_KEY, 'true');
  return { success: true, message: '登录成功' };
}

// 退出登录
export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

// 获取当前用户名
export function getCurrentUser() {
  return PRESET_USERNAME;
}
