const FINALIST_PREFIX = 'finalist_';

export function clearFinalistSession() {
  localStorage.removeItem('token');
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(FINALIST_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

export function logout(navigate) {
  clearFinalistSession();
  if (typeof navigate === 'function') {
    navigate('/');
  } else {
    window.location.href = '/';
  }
}
