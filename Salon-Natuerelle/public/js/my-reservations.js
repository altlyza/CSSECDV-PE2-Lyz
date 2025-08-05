// Ensure auth is checked and user loaded
if (!checkAuth()) {
  // Redirect is handled inside checkAuth
}

const user = storage.getUser();
let allReservations = [];

// Load reservations on page load
loadReservations();

// Filter functionality
document.getElementById('statusFilter').addEventListener('change', () => {
  filterReservations();
});

async function loadReservations() {
  try {
    ui.showLoading(document.getElementById('reservationsContainer'));
    const response = await api.reservations.getAll();

    console.log('Reservations from API:', response.reservations); // Debug log

    allReservations = response.reservations;
    displayReservations(allReservations);
  } catch (error) {
    ui.showAlert('Error loading reservations', 'error');
  }
}

function filterReservations() {
  const status = document.getElementById('statusFilter').value;
  const filtered = status
    ? allReservations.filter((r) => r.status === status)
    : allReservations;
  displayReservations(filtered);
}

function displayReservations(reservations) {
  const container = document.getElementById('reservationsContainer');

  if (reservations.length === 0) {
    container.innerHTML = '<p>No reservations found</p>';
    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Service</th>
          <th>Price</th>
          <th>Status</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${reservations
          .map((res) => `
            <tr>
              <td>${new Date(res.reservationDate).toLocaleString()}</td>
              <td>${res.Service ? res.Service.name : 'N/A'}</td>
              <td>${res.Service ? ui.formatCurrency(res.Service.price) : '-'}</td>
              <td>${res.status}</td>
              <td>${res.notes || '-'}</td>
            </tr>
          `)
          .join('')}
      </tbody>
    </table>
  `;
}
