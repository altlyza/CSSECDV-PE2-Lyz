document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) {
        // Redirect is handled in checkAuth
        return;
    }

    const user = storage.getUser();
    if (user.role !== 'Customer') {
        ui.showAlert('Only customers can book appointments', 'error');
        setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
        }, 2000);
        return;
    }

    let services = [];

    // Set minimum date to today
    document.getElementById('reservationDate').min = new Date().toISOString().split('T')[0];

    // Load services on page load
    loadServices();

    // Check for service parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('service');

    async function loadServices() {
        console.log('🔄 Loading services...');  // Debug log

        try {
            const response = await api.services.getAll();
            console.log('✅ Services response:', response);  // Debug response

            services = response.services;

            const select = document.getElementById('serviceSelect');
            select.innerHTML = '<option value="">Choose a service...</option>' +
                services.map(service =>
                    `<option value="${service.id}" ${service.id == serviceId ? 'selected' : ''}>
                        ${service.name} - ${ui.formatCurrency(service.price)} (${service.duration} min)
                    </option>`
                ).join('');

            if (serviceId) {
                showServiceDetails();
            }
        } catch (error) {
            console.error('Error loading services:', error);  // Debug error
            ui.showAlert('Error loading services', 'error');
        }
    }

    document.getElementById('serviceSelect').addEventListener('change', showServiceDetails);

    function showServiceDetails() {
        const selectedId = document.getElementById('serviceSelect').value;
        if (!selectedId) {
            document.getElementById('serviceDetails').style.display = 'none';
            return;
        }

        const service = services.find(s => s.id == selectedId);
        if (service) {
            document.getElementById('serviceDetails').innerHTML = `
                <strong>${service.name}</strong><br>
                Price: ${ui.formatCurrency(service.price)}<br>
                Duration: ${service.duration} minutes<br>
                ${service.description ? `Description: ${service.description}` : ''}
            `;
            document.getElementById('serviceDetails').style.display = 'block';
        }
    }

    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const serviceId = document.getElementById('serviceSelect').value;
        const date = document.getElementById('reservationDate').value;
        const time = document.getElementById('reservationTime').value;
        const notes = document.getElementById('notes').value;

        // Combine date and time
        const reservationDate = new Date(`${date}T${time}`);

        // Validate future date
        if (reservationDate <= new Date()) {
            ui.showAlert('Please select a future date and time', 'error');
            return;
        }

        try {
            await api.reservations.create({
                serviceId: parseInt(serviceId),
                reservationDate: reservationDate.toISOString(),
                notes
            });

            ui.showAlert('Appointment booked successfully!', 'success');

            setTimeout(() => {
                window.location.href = '/pages/my-reservations.html';
            }, 2000);

        } catch (error) {
            ui.showAlert(error.message, 'error');
        }
    });
});
