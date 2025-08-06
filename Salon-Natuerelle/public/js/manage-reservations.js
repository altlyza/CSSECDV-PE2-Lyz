document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) return;

    try {
        ui.showLoading(document.getElementById("reservationsContainer"));

        const data = await api.reservations.getAll();
        renderReservations(data.reservations);
    } catch (err) {
        ui.showAlert(err.message, "error");
    }
});

function renderReservations(reservations) {
    const container = document.getElementById("reservationsContainer");
    container.innerHTML = "";

    if (!reservations || reservations.length === 0) {
        container.innerHTML = "<p>No reservations found.</p>";
        return;
    }

    reservations.forEach(res => {
        const div = document.createElement("div");
        div.className = "reservation-card";
        div.innerHTML = `
            <p><strong>Customer:</strong> ${res.customer?.name || 'N/A'}</p>
            <p><strong>Date:</strong> ${ui.formatDate(res.reservationDate)}</p>
            <p><strong>Service:</strong> ${res.Service?.name || 'N/A'}</p>
            <select data-id="${res.id}">
                <option value="pending" ${res.status === "pending" ? "selected" : ""}>Pending</option>
                <option value="confirmed" ${res.status === "confirmed" ? "selected" : ""}>Confirmed</option>
                <option value="completed" ${res.status === "completed" ? "selected" : ""}>Completed</option>
                <option value="cancelled" ${res.status === "cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
            <button class="update-btn" data-id="${res.id}">Update</button>
        `;
        container.appendChild(div);
    });

    // Attach event listeners here
    document.querySelectorAll(".update-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            await updateStatus(id);
        });
    });
}


async function updateStatus(id) {
    const select = document.querySelector(`select[data-id="${id}"]`);
    try {
        await api.reservations.update(id, { status: select.value });
        ui.showAlert("Status updated!", "success");

        // Reload updated reservations
        const data = await api.reservations.getAll();
        renderReservations(data.reservations);
    } catch (err) {
        console.error(err);
        ui.showAlert("Failed to update status", "error");
    }
}