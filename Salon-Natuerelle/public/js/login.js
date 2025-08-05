document.addEventListener('DOMContentLoaded', () => {
    navigation.updateNav();

    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await api.auth.login({ email, password });

            console.log("Login response:", response);

            storage.setToken(response.token);
            storage.setUser(response.user);

            ui.showAlert('Login successful!', 'success');

            setTimeout(() => {
                const role = response.user.role;
                if (role === 'Admin') {
                    window.location.href = '/pages/admin.html';
                } else {
                    window.location.href = '/pages/dashboard.html';
                }
            }, 1000);
        } catch (err) {
            console.error("Login failed:", err);
            ui.showAlert(err.message || 'Login failed. Please try again.', 'error');
        }
    });
});
