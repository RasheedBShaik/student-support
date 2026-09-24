import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
  try {
    const { default: connectDB } = await import("../lib/mongodb");
    const { default: User } = await import("../models/User");
    const { default: Department } = await import("../models/Department");

    await connectDB();

    console.log("Connected to MongoDB");

    // Create Departments
    const accounts = await Department.findOneAndUpdate(
      { name: "Accounts" },
      {
        name: "Accounts",
        description: "Handles fees, payments and financial requests",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const administration = await Department.findOneAndUpdate(
      { name: "Administration" },
      {
        name: "Administration",
        description:
          "Handles documents, ID cards and administrative requests",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const examination = await Department.findOneAndUpdate(
      { name: "Examination" },
      {
        name: "Examination",
        description:
          "Handles examinations, results and academic requests",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log("Departments created");

    // Create Test Student
    const student = await User.findOneAndUpdate(
      { email: "student@example.com" },
      {
        name: "Rahul Sharma",
        email: "student@example.com",
        password: "test123",
        role: "STUDENT",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log("Student created:", student._id);

    // Create Test Staff
    const staff = await User.findOneAndUpdate(
      { email: "staff@example.com" },
      {
        name: "Priya Nair",
        email: "staff@example.com",
        password: "test123",
        role: "STAFF",
        department: accounts._id,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log("Staff created:", staff._id);

    console.log("\nSeed completed successfully!");
    console.log("--------------------------------");
    console.log("Student ID:", student._id);
    console.log("Staff ID:", staff._id);
    console.log("Accounts ID:", accounts._id);
    console.log("Administration ID:", administration._id);
    console.log("Examination ID:", examination._id);

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
