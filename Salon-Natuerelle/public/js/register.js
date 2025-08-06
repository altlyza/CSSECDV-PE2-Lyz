document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('registerForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            ui.showAlert('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await api.auth.register({ name, email, password });
            storage.setToken(response.token);
            storage.setUser(response.user);

            ui.showAlert('Registration successful!', 'success');

            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1000);

        } catch (error) {
            ui.showAlert(error.message, 'error');
        }
    });

    
});
