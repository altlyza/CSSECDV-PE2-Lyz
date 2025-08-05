const { sequelize, User, Service } = require('../models');
const { hashPassword } = require('../utils/hashPassword');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');

    // Check if users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('⚠️  Users already exist. Skipping seeding...');
      return;
    }

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@salonnatuerelle.com',
      password:'Admin@123',
      role: 'Admin'
    });
    console.log('✅ Admin created');

    // Create Manager
    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@salonnatuerelle.com',
      password: 'Manager@123',
      role: 'Manager'
    });
    console.log('✅ Manager created');

    // Create Customers
    await User.bulkCreate([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await hashPassword('Customer@123'),
        role: 'Customer'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: await hashPassword('Customer@123'),
        role: 'Customer'
      }
    ]);
    console.log('✅ Customers created');

    // Create Services (owned by manager)
    await Service.bulkCreate([
      {
        name: 'Haircut',
        description: 'Professional haircut with styling',
        price: 30.0,
        duration: 45,
        createdBy: manager.id
      },
      {
        name: 'Hair Coloring',
        description: 'Full hair coloring service',
        price: 80.0,
        duration: 120,
        createdBy: manager.id
      },
      {
        name: 'Manicure',
        description: 'Complete nail care and polish',
        price: 25.0,
        duration: 30,
        createdBy: manager.id
      },
      {
        name: 'Pedicure',
        description: 'Foot care and nail treatment',
        price: 35.0,
        duration: 45,
        createdBy: manager.id
      },
      {
        name: 'Facial Treatment',
        description: 'Deep cleansing facial',
        price: 60.0,
        duration: 60,
        createdBy: manager.id
      }
    ]);
    console.log('✅ Services created');

    console.log('\n🎉 Seeding complete!');
    console.log('🧪 Test accounts:');
    console.log('Admin    ➤ admin@salonnatuerelle.com / Admin@123');
    console.log('Manager  ➤ manager@salonnaturelle.com / Manager@123');
    console.log('Customer ➤ john@example.com / Customer@123');
    console.log('Customer ➤ jane@example.com / Customer@123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
