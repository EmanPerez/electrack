// Check if user is logged in
function checkAuth() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', checkAuth); 