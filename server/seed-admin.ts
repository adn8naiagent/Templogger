
import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedAdminUser() {
  try {
    const adminEmail = "admin1@email.com";
    
    // Check if admin user already exists
    const existingUser = await storage.getUserByEmail(adminEmail);
    if (existingUser) {
      console.log(`Admin user ${adminEmail} already exists`);
      
      // Update to admin role if not already
      if (existingUser.role !== "admin") {
        await storage.updateUser(existingUser.id, { role: "admin" });
        console.log(`Updated ${adminEmail} to admin role`);
      }
      return;
    }

    // Create new admin user
    const hashedPassword = await hashPassword("admin123"); // Default password
    
    const adminUser = await storage.createUser({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      subscriptionStatus: "enterprise"
    });

    console.log(`✅ Admin user created successfully:`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Default Password: admin123`);
    console.log(`\n⚠️  Please change the password after first login!`);
    
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

// Run the seeding function
seedAdminUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
