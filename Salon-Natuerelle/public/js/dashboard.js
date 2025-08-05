// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) {
    // Redirect is handled inside checkAuth()
    return;
  }

  const user = storage.getUser();
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userRole').textContent = user.role;

  // Load dashboard data
  loadDashboard();

  async function loadDashboard() {
    const user = storage.getUser();

    if (user.role === 'Customer') {
      await loadCustomerStats();
    } else if (user.role === 'Manager') {
      await loadManagerStats();
    } else if (user.role === 'Admin') {
      await loadAdminStats();
    }

    await loadUpcomingReservations();
    loadQuickActions(user.role);
  }

  async function loadCustomerStats() {
    try {
      const reservations = await api.reservations.getAll();
      const stats = {
        total: reservations.reservations.length,
        upcoming: reservations.reservations.filter(r =>
          r.status === 'pending' || r.status === 'confirmed'
        ).length,
        completed: reservations.reservations.filter(r =>
          r.status === 'completed'
        ).length
      };

      // NOTE: Your original code references `users` and `logs` which
      // are undefined here. Adjust as needed.

      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Reservations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.upcoming}</div>
          <div class="stat-label">Upcoming Reservations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.completed}</div>
          <div class="stat-label">Completed Reservations</div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadUpcomingReservations() {
    try {
      const response = await api.reservations.getAll({
        status: 'confirmed',
        limit: 5
      });

      const container = document.getElementById('upcomingReservations');

      if (response.reservations.length === 0) {
        container.innerHTML = '<p>No upcoming reservations</p>';
        return;
      }

      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Service</th>
              <th>Customer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${response.reservations.map(reservation => `
              <tr>
                <td>${ui.formatDate(reservation.reservationDate)}</td>
                <td>${reservation.Service.name}</td>
                <td>${reservation.customer.name}</td>
                <td>
                  <span class="badge ${ui.getStatusBadgeClass(reservation.status)}">
                    ${reservation.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  }

  function loadQuickActions(role) {
    const actionsGrid = document.getElementById('actionsGrid');

    if (role === 'Customer') {
      actionsGrid.innerHTML = `
        <a href="/pages/book.html" class="btn btn-primary">Book Appointment</a>
        <a href="/pages/my-reservations.html" class="btn btn-secondary">View Reservations</a>
        <a href="/pages/services.html" class="btn btn-secondary">Browse Services</a>
      `;
    } else if (role === 'Manager') {
      actionsGrid.innerHTML = `
        <a href="/pages/services.html" class="btn btn-primary">Manage Services</a>
        <a href="/pages/my-reservations.html" class="btn btn-secondary">View All Reservations</a>
        <a href="/pages/admin.html#customers" class="btn btn-secondary">View Customers</a>
      `;
    } else if (role === 'Admin') {
      actionsGrid.innerHTML = `
        <a href="/pages/admin.html" class="btn btn-primary">Admin Panel</a>
        <a href="/pages/admin.html#users" class="btn btn-secondary">Manage Users</a>
        <a href="/pages/admin.html#logs" class="btn btn-secondary">View Logs</a>
      `;
    }
  }

  // You may want to define loadManagerStats and loadAdminStats similarly,
  // or just create placeholders for now:
  async function loadManagerStats() {
    // Implement manager stats loading logic here
  }

  async function loadAdminStats() {
    // Implement admin stats loading logic here
  }
});
