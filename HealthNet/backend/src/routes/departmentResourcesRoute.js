const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Department = require("../models/Department");
const Resource = require("../models/Resource");
const ResourceValidation = require("../models/ResourceValidation");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const csvPath = path.join(__dirname, "..", "department_resources.csv");

const readCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`[DepartmentResources] CSV file not found at ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

const writeCsv = (filePath, rows) => {
  const columns = ["Department", "Resource Name", "Category", "Min Quantity", "Max Quantity", "Current Quantity", "Status"];
  const escapeCell = (value) => {
    const raw = value === undefined || value === null ? "" : String(value).trim();
    if (/[,"]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.join(",");
  const lines = rows.map((row) => {
    const dept = row.Department || row.department || "";
    const name = row["Resource Name"] || row.resource_name || row.name || "";
    const cat = row.Category || row.category || "";
    const min = row["Min Quantity"] || row.min_quantity || 0;
    const max = row["Max Quantity"] || row.max_quantity || 0;
    const qty = row["Current Quantity"] || row.current_quantity || row.available_quantity || 0;
    const status = row.Status || row.status || "Medium";
    
    return [dept, name, cat, min, max, qty, status].map(escapeCell).join(",");
  });

  fs.writeFileSync(filePath, [header, ...lines].join("\n"), "utf8");
};

const inferResourceType = (name) => {
  const token = String(name || "").trim().toLowerCase();
  if (token.includes("bed")) return "bed";
  if (token.includes("room")) return "room";
  if (token.includes("medicine") || token.includes("drug") || token.includes("syrup") || token.includes("tablet") || token.includes("packet") || token.includes("drop") || token.includes("sachet")) {
    return "medicine";
  }
  return "equipment";
};

// GET /api/department-resources?hospital_id=XXX
router.get("/", async (req, res) => {
  try {
    const { hospital_id } = req.query;
    if (!hospital_id) {
      return res.status(400).json({ success: false, message: "hospital_id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(hospital_id)) {
      return res.status(400).json({ success: false, message: "Invalid hospital_id format" });
    }

    // 1. Fetch departments from database
    const departments = await Department.find({ hospital_id })
      .populate("head_doctor_id", "name email specialization status")
      .lean();

    // 2. Fetch resources from MongoDB Resource collection
    let dbResources = await Resource.find({ hospital_id }).lean();

    // 3. Auto-seed resources from CSV if database has 0 departmental resources for this hospital
    const hasDeptResources = dbResources.some((r) => r.department_id);
    if (!hasDeptResources) {
      console.log(`[DepartmentResources] Seeding resources from CSV for hospital ${hospital_id}...`);
      const csvRows = await readCsv(csvPath);
      const docsToInsert = [];

      for (const row of csvRows) {
        const csvDept = row.Department || row.department;
        if (!csvDept) continue;

        const matchedDept = departments.find(
          (d) => d.name.trim().toLowerCase() === csvDept.trim().toLowerCase()
        );
        const deptId = matchedDept ? matchedDept._id : null;

        const currentQty = parseInt(row["Current Quantity"] || row["current_quantity"]) || 0;
        const minQty = parseInt(row["Min Quantity"] || row["min_quantity"]) || 0;
        const maxQty = parseInt(row["Max Quantity"] || row["max_quantity"]) || 0;
        const status = row["Status"] || row["status"] || "Medium";
        const name = row["Resource Name"] || row["resource_name"] || "Unnamed Resource";
        const category = row["Category"] || row["category"] || "General";

        docsToInsert.push({
          name,
          type: inferResourceType(name),
          hospital_id: new mongoose.Types.ObjectId(hospital_id),
          department_id: deptId,
          quantity: maxQty,
          available_quantity: currentQty,
          min_quantity: minQty,
          max_quantity: maxQty,
          category,
          status,
          unit: "units",
        });
      }

      if (docsToInsert.length > 0) {
        await Resource.insertMany(docsToInsert);
        dbResources = await Resource.find({ hospital_id }).lean();
        console.log(`[DepartmentResources] Successfully seeded ${dbResources.length} resources.`);
      }
    }

    // 4. Map resources to departments
    const responseData = departments.map((dept) => {
      const deptResources = dbResources.filter(
        (res) => res.department_id && String(res.department_id) === String(dept._id)
      );

      const resources = deptResources.map((res) => {
        const currentQty = res.available_quantity || 0;
        const minQty = res.min_quantity || 0;
        const maxQty = res.max_quantity || 0;
        const status = res.status || "Medium";

        return {
          id: String(res._id),
          name: res.name,
          category: res.category || "General",
          minQuantity: minQty,
          maxQuantity: maxQty,
          currentQuantity: currentQty,
          status: status,
          isLowStock: status.toLowerCase() === "low" || currentQty <= minQty,
        };
      });

      const totalUnits = resources.reduce((sum, r) => sum + r.currentQuantity, 0);
      const lowStockResources = resources.filter((r) => r.isLowStock);
      const hasLowStock = lowStockResources.length > 0;

      return {
        _id: dept._id,
        name: dept.name,
        description: dept.description,
        status: dept.status,
        headDoctor: dept.head_doctor_id ? dept.head_doctor_id.name : "N/A",
        headDoctorSpecialization: dept.head_doctor_id ? dept.head_doctor_id.specialization : "",
        resources: resources,
        resourceCount: resources.length,
        totalUnits: totalUnits,
        lowStockCount: lowStockResources.length,
        hasLowStock: hasLowStock,
      };
    });

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error("Error in department resources route:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/department-resources — Add a departmental resource
router.post("/", async (req, res) => {
  try {
    const { hospital_id, department_id, name, category, min_quantity, max_quantity, current_quantity, status } = req.body;

    if (!hospital_id || !name) {
      return res.status(400).json({ success: false, message: "hospital_id and name are required." });
    }

    const newResource = await Resource.create({
      name: name.trim(),
      type: inferResourceType(name),
      hospital_id: new mongoose.Types.ObjectId(hospital_id),
      department_id: department_id ? new mongoose.Types.ObjectId(department_id) : null,
      quantity: parseInt(max_quantity) || 0,
      available_quantity: parseInt(current_quantity) || 0,
      min_quantity: parseInt(min_quantity) || 0,
      max_quantity: parseInt(max_quantity) || 0,
      category: category || "General",
      status: status || "Medium",
      unit: "units",
    });

    return res.status(201).json({
      success: true,
      message: "Resource added successfully.",
      data: newResource,
    });
  } catch (err) {
    console.error("Error adding resource:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PUT /api/department-resources/:id — Update a departmental resource
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, min_quantity, max_quantity, current_quantity, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID format." });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }

    if (name !== undefined) {
      resource.name = name.trim();
      resource.type = inferResourceType(name);
    }
    if (category !== undefined) resource.category = category;
    if (min_quantity !== undefined) resource.min_quantity = parseInt(min_quantity) || 0;
    if (max_quantity !== undefined) {
      resource.max_quantity = parseInt(max_quantity) || 0;
      resource.quantity = parseInt(max_quantity) || 0;
    }
    if (current_quantity !== undefined) resource.available_quantity = parseInt(current_quantity) || 0;
    if (status !== undefined) resource.status = status;

    await resource.save();

    return res.json({
      success: true,
      message: "Resource updated successfully.",
      data: resource,
    });
  } catch (err) {
    console.error("Error updating resource:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE /api/department-resources/:id — Delete a departmental resource
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID format." });
    }

    const deleted = await Resource.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }

    return res.json({
      success: true,
      message: "Resource deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting resource:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/department-resources/validations?hospital_id=XXX
router.get("/validations", async (req, res) => {
  try {
    const { hospital_id, status } = req.query;
    if (!hospital_id) {
      return res.status(400).json({ success: false, message: "hospital_id is required" });
    }
    const filter = { hospital_id };
    if (status) {
      filter.status = status;
    }
    
    const validations = await ResourceValidation.find(filter)
      .populate("patient_id", "name email phone")
      .populate("doctor_id", "name")
      .populate("department_id", "name")
      .populate("prescription_id", "medicines instructions dosage")
      .sort({ created_at: -1 })
      .lean();
       
    return res.json({ success: true, data: validations });
  } catch (err) {
    console.error("Error fetching resource validations:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/department-resources/validations/:id/approve
router.post("/validations/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid validation ID format." });
    }

    const validation = await ResourceValidation.findById(id)
      .populate("department_id", "name")
      .populate("patient_id", "name");
      
    if (!validation) {
      return res.status(404).json({ success: false, message: "Resource validation request not found." });
    }

    if (validation.status !== "pending") {
      return res.status(400).json({ success: false, message: `This request is already ${validation.status}.` });
    }

    const deptName = validation.department_id ? validation.department_id.name : "";
    const csvRows = await readCsv(csvPath);

    // Update MongoDB resources & record CSV changes
    for (const item of validation.resources) {
      const dbRes = await Resource.findById(item.resource_id);
      if (dbRes) {
        // Deduct
        const newQty = Math.max(0, (dbRes.available_quantity || 0) - (item.quantity_requested || 1));
        dbRes.available_quantity = newQty;

        // Recalculate status
        let newStatus = "Medium";
        if (newQty <= 0) {
          newStatus = "Out of stock";
        } else if (newQty <= (dbRes.min_quantity || 0)) {
          newStatus = "Low";
        } else if (newQty >= (dbRes.max_quantity || 0) * 0.8) {
          newStatus = "Very High";
        } else if (newQty >= (dbRes.max_quantity || 0) * 0.5) {
          newStatus = "High";
        }
        dbRes.status = newStatus;
        await dbRes.save();

        // Update CSV Row mapping
        const csvRow = csvRows.find(
          (row) =>
            (row.Department || "").trim().toLowerCase() === deptName.trim().toLowerCase() &&
            (row["Resource Name"] || "").trim().toLowerCase() === dbRes.name.trim().toLowerCase()
        );

        if (csvRow) {
          csvRow["Current Quantity"] = newQty;
          csvRow["Status"] = newStatus;
        }
      }
    }

    // Save updated rows back to CSV
    writeCsv(csvPath, csvRows);

    validation.status = "approved";
    await validation.save();

    return res.json({
      success: true,
      message: "Resource deduction approved and inventory updated successfully.",
      data: validation,
    });
  } catch (err) {
    console.error("Error approving resource validation:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/department-resources/validations/:id/reject
router.post("/validations/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid validation ID format." });
    }

    const validation = await ResourceValidation.findById(id);
    if (!validation) {
      return res.status(404).json({ success: false, message: "Resource validation request not found." });
    }

    if (validation.status !== "pending") {
      return res.status(400).json({ success: false, message: `This request is already ${validation.status}.` });
    }

    validation.status = "rejected";
    await validation.save();

    return res.json({
      success: true,
      message: "Resource deduction request rejected.",
      data: validation,
    });
  } catch (err) {
    console.error("Error rejecting resource validation:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
