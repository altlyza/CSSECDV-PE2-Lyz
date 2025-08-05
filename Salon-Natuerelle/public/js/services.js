const user = storage.getUser();
let allServices = [];

// Show manager actions if user is manager/admin
if (user.role === 'Manager' || user.role === 'Admin') {
  document.getElementById('managerActions').style.display = 'block';
}

// Load services on page load
loadServices();

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm) ||
    (service.description && service.description.toLowerCase().includes(searchTerm))
  );
  displayServices(filtered);
});

async function loadServices() {
  try {
    ui.showLoading(document.getElementById('servicesGrid'));
    const response = await api.services.getAll();
    allServices = response.services;
    displayServices(allServices);
  } catch (error) {
    ui.showAlert('Error loading services', 'error');
  }
}

function displayServices(services) {
  const grid = document.getElementById('servicesGrid');

  if (services.length === 0) {
    grid.innerHTML = '<p>No services found</p>';
    return;
  }

  grid.innerHTML = services.map(service => `
    <div class="service-card">
      <h3 class="service-name">${service.name}</h3>
      <p class="service-price">${ui.formatCurrency(service.price)}</p>
      <p class="service-duration">${service.duration} minutes</p>
      ${service.description ? `<p>${service.description}</p>` : ''}

      <div style="margin-top: 1rem;">
        ${
          user.role === 'Customer' ? 
          `<a href="/pages/book.html?service=${service.id}" class="btn btn-primary btn-sm">Book Now</a>` :
          (user.role === 'Manager' || user.role === 'Admin') ? `
            <button class="btn btn-secondary btn-sm" onclick="editService(${service.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteService(${service.id})">Delete</button>
          ` : ''
        }
      </div>
    </div>
  `).join('');
}

function showAddServiceModal() {
  document.getElementById('modalTitle').textContent = 'Add Service';
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceId').value = '';
  document.getElementById('serviceModal').style.display = 'block';
}

function hideServiceModal() {
  document.getElementById('serviceModal').style.display = 'none';
}

async function editService(id) {
  try {
    const response = await api.services.getOne(id);
    const service = response.service;

    document.getElementById('modalTitle').textContent = 'Edit Service';
    document.getElementById('serviceId').value = service.id;
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceDescription').value = service.description || '';
    document.getElementById('servicePrice').value = service.price;
    document.getElementById('serviceDuration').value = service.duration;

    document.getElementById('serviceModal').style.display = 'block';
  } catch (error) {
    ui.showAlert('Error loading service', 'error');
  }
}

async function deleteService(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;

  try {
    await api.services.delete(id);
    ui.showAlert('Service deleted successfully', 'success');
    loadServices();
  } catch (error) {
    ui.showAlert('Error deleting service', 'error');
  }
}

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const serviceId = document.getElementById('serviceId').value;
  const serviceData = {
    name: document.getElementById('serviceName').value,
    description: document.getElementById('serviceDescription').value,
    price: parseFloat(document.getElementById('servicePrice').value),
    duration: parseInt(document.getElementById('serviceDuration').value)
  };

  try {
    if (serviceId) {
      await api.services.update(serviceId, serviceData);
      ui.showAlert('Service updated successfully', 'success');
    } else {
      await api.services.create(serviceData);
      ui.showAlert('Service created successfully', 'success');
    }

    hideServiceModal();
    loadServices();
  } catch (error) {
    ui.showAlert(error.message, 'error');
  }
});
