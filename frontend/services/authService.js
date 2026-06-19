const BASE_URL = 'http://192.168.1.X:8080/api/v1/auth'; // Put your IPv4 here

export const registerUser = async (name, email, password) => {
  const response = await fetch(${BASE_URL}/register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return response.ok;
};

export const loginUser = async (email, password) => {
  const response = await fetch(${BASE_URL}/login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.ok;
};