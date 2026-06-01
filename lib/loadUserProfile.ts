export function loadUserProfile() {
    const data = localStorage.getItem("userProfile");
    return data ? JSON.parse(data) : null;
  }