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
          <th>Action</th> <!-- NEW COLUMN -->
        </tr>
      </thead>
      <tbody>
        ${reservations
          .map((res) => {
            const isPending = res.status === 'pending';
            const cancelBtn = isPending
              ? `<button class="btn btn-danger btn-cancel" data-id="${res.id}">Cancel</button>`
              : '';

            return `
              <tr>
                <td>${new Date(res.reservationDate).toLocaleString()}</td>
                <td>${res.Service ? res.Service.name : 'N/A'}</td>
                <td>${res.Service ? ui.formatCurrency(res.Service.price) : '-'}</td>
                <td>${res.status}</td>
                <td>${res.notes || '-'}</td>
                <td>${cancelBtn}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;

  // Add event listeners to Cancel buttons
  document.querySelectorAll('.btn-cancel').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to cancel this reservation?')) {
        try {
        const response = await fetch(`http://localhost:8080/api/reservations/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });



        if (!response.ok) {
          throw new Error('Failed to cancel reservation');
        }
          await loadReservations(); // Refresh list
        } catch (err) {
          ui.showAlert('Failed to cancel reservation', 'error');
        }
      }
    });
  });
}
