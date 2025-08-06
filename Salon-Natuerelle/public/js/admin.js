document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;

    const user = storage.getUser();
    if (user.role !== 'Admin') {
        ui.showAlert('Admin access required', 'error');
        setTimeout(() => window.location.href = '/pages/dashboard.html', 2000);
        return;
    }

    // Tab switching
    document.querySelectorAll(".tab-button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
            document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
            document.getElementById(`${btn.dataset.tab}Tab`).style.display = "block";
            btn.classList.add("active");
        });
    });

    loadUsers();
    loadLogs();

    // Event delegation for role change & delete
    document.getElementById("usersContainer").addEventListener("change", e => {
        if (e.target.classList.contains("role-select")) {
            changeUserRole(e.target.dataset.userId, e.target.value);
        }
    });

    document.getElementById("usersContainer").addEventListener("click", e => {
        if (e.target.classList.contains("delete-user-btn")) {
            deleteUser(e.target.dataset.userId);
        }
    });

    // Filters
    document.getElementById("actionFilter").addEventListener("change", filterLogs);
    document.getElementById("dateFilter").addEventListener("change", filterLogs);

    // Staff registration
    document.getElementById("staffForm").addEventListener("submit", async e => {
        e.preventDefault();
        const staffData = {
            name: staffName.value,
            email: staffEmail.value,
            password: staffPassword.value,
            role: staffRole.value
        };
        try {
            await api.users.registerStaff(staffData);
            ui.showAlert('Staff member registered successfully', 'success');
            staffForm.reset();
            loadUsers();
        } catch (error) {
            ui.showAlert(error.message, 'error');
        }
    });

    // User search
    document.getElementById("userSearch").addEventListener("input", async e => {
        const search = e.target.value;
        if (search.length < 2 && search.length > 0) return;
        try {
            const response = await api.users.getAll({ search });
            displayUsers(response.users);
        } catch {
            ui.showAlert('Error searching users', 'error');
        }
    });
});

async function loadUsers() {
    try {
        const response = await api.users.getAll();
        displayUsers(response.users);
    } catch {
        ui.showAlert('Error loading users', 'error');
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>
                            <select class="role-select" data-user-id="${user.id}">
                                <option value="Customer" ${user.role === 'Customer' ? 'selected' : ''}>Customer</option>
                                <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
                                <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td><button class="btn btn-danger btn-sm delete-user-btn" data-user-id="${user.id}">Delete</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function changeUserRole(userId, newRole) {
    try {
        await api.users.changeRole(userId, newRole);
        ui.showAlert('User role updated successfully', 'success');
        loadUsers();
    } catch {
        ui.showAlert('Error updating user role', 'error');
        loadUsers();
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        await api.users.delete(userId);
        ui.showAlert('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        ui.showAlert(error.message, 'error');
    }
}

async function loadLogs() {
    try {
        const response = await api.logs.getAll();
        displayLogs(response.logs);
        const actions = [...new Set(response.logs.map(log => log.action))];
        const actionFilter = document.getElementById('actionFilter');
        actionFilter.innerHTML = '<option value="">All Actions</option>' +
            actions.map(action => `<option value="${action}">${action}</option>`).join('');
    } catch {
        ui.showAlert('Error loading logs', 'error');
    }
}

function displayLogs(logs) {
    const container = document.getElementById('logsContainer');
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Description</th><th>IP Address</th></tr>
            </thead>
            <tbody>
                ${logs.map(log => `
                    <tr>
                        <td>${ui.formatDate(log.timestamp)}</td>
                        <td>${log.User ? log.User.email : 'System'}</td>
                        <td>${log.action}</td>
                        <td>${log.description}</td>
                        <td>${log.ipAddress || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function filterLogs() {
    const action = document.getElementById('actionFilter').value;
    const date = document.getElementById('dateFilter').value;
    const params = {};
    if (action) params.action = action;
    if (date) {
        params.startDate = date;
        params.endDate = date;
    }
    try {
        const response = await api.logs.getAll(params);
        displayLogs(response.logs);
    } catch {
        ui.showAlert('Error filtering logs', 'error');
    }
}
