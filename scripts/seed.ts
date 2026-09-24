import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });

async function seed() {
  try {
    const { default: connectDB } =
      await import("../lib/mongodb");

    const { default: User } =
      await import("../models/User");

    const { default: Department } =
      await import("../models/Department");

    const { default: Ticket } =
      await import("../models/Ticket");

    await connectDB();

    console.log("Connected to MongoDB");

    // --------------------------------------------------
    // 1. CREATE / UPDATE DEPARTMENTS
    // --------------------------------------------------

    const accounts =
      await Department.findOneAndUpdate(
        { name: "Accounts" },
        {
          name: "Accounts",
          description:
            "Handles fees, payments and financial requests",
          isActive: true,
        },
        {
          upsert: true,
          new: true,
        },
      );

    const administration =
      await Department.findOneAndUpdate(
        { name: "Administration" },
        {
          name: "Administration",
          description:
            "Handles documents, ID cards and administrative requests",
          isActive: true,
        },
        {
          upsert: true,
          new: true,
        },
      );

    const examination =
      await Department.findOneAndUpdate(
        { name: "Examination" },
        {
          name: "Examination",
          description:
            "Handles examinations, results and academic requests",
          isActive: true,
        },
        {
          upsert: true,
          new: true,
        },
      );

    console.log("Departments created/updated");

    // --------------------------------------------------
    // 2. CREATE / UPDATE TEST PASSWORD
    // --------------------------------------------------

    const hashedPassword =
      await bcrypt.hash("test123", 10);

    // --------------------------------------------------
    // 3. CREATE / UPDATE STUDENT
    // --------------------------------------------------

    const student =
      await User.findOneAndUpdate(
        {
          email: "student@example.com",
        },
        {
          name: "Rahul Sharma",
          email: "student@example.com",
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
          department: null,
        },
        {
          upsert: true,
          new: true,
        },
      );

    console.log(
      "Student created/updated:",
      student._id.toString(),
    );

    // --------------------------------------------------
    // 4. CREATE / UPDATE STAFF
    // --------------------------------------------------

    const staff =
      await User.findOneAndUpdate(
        {
          email: "staff@example.com",
        },
        {
          name: "Priya Nair",
          email: "staff@example.com",
          password: hashedPassword,
          role: "STAFF",
          department: accounts._id,
          isActive: true,
        },
        {
          upsert: true,
          new: true,
        },
      );

    console.log(
      "Staff created/updated:",
      staff._id.toString(),
    );

    // --------------------------------------------------
    // 5. REPAIR EXISTING TICKETS
    // --------------------------------------------------
    //
    // Old tickets may have been created before
    // departmentId was added.
    //
    // This assigns departments based on category.
    //

    const feesResult =
      await Ticket.updateMany(
        {
          category: "FEES",
          $or: [
            {
              departmentId: {
                $exists: false,
              },
            },
            {
              departmentId: null,
            },
          ],
        },
        {
          $set: {
            departmentId: accounts._id,
          },
        },
      );

    const administrationResult =
      await Ticket.updateMany(
        {
          category: {
            $in: [
              "ATTENDANCE",
              "ID_CARD",
              "DOCUMENTS",
              "CERTIFICATES",
              "HOSTEL",
              "TRANSPORT",
              "OTHER",
            ],
          },

          $or: [
            {
              departmentId: {
                $exists: false,
              },
            },
            {
              departmentId: null,
            },
          ],
        },
        {
          $set: {
            departmentId:
              administration._id,
          },
        },
      );

    const examinationResult =
      await Ticket.updateMany(
        {
          category: "EXAMINATION",

          $or: [
            {
              departmentId: {
                $exists: false,
              },
            },
            {
              departmentId: null,
            },
          ],
        },
        {
          $set: {
            departmentId:
              examination._id,
          },
        },
      );

    console.log(
      "Existing tickets repaired",
    );

    console.log(
      `Fees tickets repaired: ${feesResult.modifiedCount}`,
    );

    console.log(
      `Administration tickets repaired: ${administrationResult.modifiedCount}`,
    );

    console.log(
      `Examination tickets repaired: ${examinationResult.modifiedCount}`,
    );

    // --------------------------------------------------
    // 6. SHOW TICKET COUNTS
    // --------------------------------------------------

    const totalTickets =
      await Ticket.countDocuments();

    const accountsTickets =
      await Ticket.countDocuments({
        departmentId: accounts._id,
      });

    const administrationTickets =
      await Ticket.countDocuments({
        departmentId:
          administration._id,
      });

    const examinationTickets =
      await Ticket.countDocuments({
        departmentId:
          examination._id,
      });

    console.log("\nTicket Summary");
    console.log("--------------------------------");

    console.log(
      "Total tickets:",
      totalTickets,
    );

    console.log(
      "Accounts tickets:",
      accountsTickets,
    );

    console.log(
      "Administration tickets:",
      administrationTickets,
    );

    console.log(
      "Examination tickets:",
      examinationTickets,
    );

    // --------------------------------------------------
    // 7. LOGIN DETAILS
    // --------------------------------------------------

    console.log(
      "\nSeed completed successfully!",
    );

    console.log(
      "--------------------------------",
    );

    console.log(
      "\nStudent Login",
    );

    console.log(
      "Email: student@example.com",
    );

    console.log(
      "Password: test123",
    );

    console.log(
      "Student ID:",
      student._id.toString(),
    );

    console.log(
      "\nStaff Login",
    );

    console.log(
      "Email: staff@example.com",
    );

    console.log(
      "Password: test123",
    );

    console.log(
      "Staff ID:",
      staff._id.toString(),
    );

    console.log(
      "Staff Department:",
      accounts.name,
    );

    console.log(
      "\nDepartments",
    );

    console.log(
      "Accounts ID:",
      accounts._id.toString(),
    );

    console.log(
      "Administration ID:",
      administration._id.toString(),
    );

    console.log(
      "Examination ID:",
      examination._id.toString(),
    );

    console.log(
      "\n--------------------------------",
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Seed failed:",
      error,
    );

    process.exit(1);
  }
}

seed();
