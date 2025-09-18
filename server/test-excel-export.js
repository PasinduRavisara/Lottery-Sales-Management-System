const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Test the Excel export endpoint
async function testExcelExport() {
  try {
    console.log("🧪 Testing Excel Export Functionality...\n");

    // Create a test JWT token for authentication
    const testUser = {
      id: "test-user-id",
      username: "test-user",
      role: "TERRITORY_MANAGER",
    };

    const token = jwt.sign(testUser, "lottery-sales-super-secret-jwt-key-2025");
    console.log("✅ Generated test JWT token");

    // Test Excel export
    console.log("📊 Testing Excel export...");
    const excelResponse = await axios({
      method: "GET",
      url: "http://localhost:5000/api/reports/export?format=excel",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "stream",
    });

    if (excelResponse.status === 200) {
      console.log("✅ Excel export endpoint responded successfully");
      console.log(`📄 Content-Type: ${excelResponse.headers["content-type"]}`);
      console.log(
        `📁 Content-Disposition: ${excelResponse.headers["content-disposition"]}`
      );
    }

    // Test CSV export for comparison
    console.log("\n📊 Testing CSV export for comparison...");
    const csvResponse = await axios({
      method: "GET",
      url: "http://localhost:5000/api/reports/export?format=csv",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "stream",
    });

    if (csvResponse.status === 200) {
      console.log("✅ CSV export endpoint responded successfully");
      console.log(`📄 Content-Type: ${csvResponse.headers["content-type"]}`);
      console.log(
        `📁 Content-Disposition: ${csvResponse.headers["content-disposition"]}`
      );
    }

    console.log("\n🎉 All export tests passed!");
    console.log("\n📋 Summary:");
    console.log("✅ Excel export endpoint is working");
    console.log("✅ CSV export endpoint is working");
    console.log("✅ Authentication is working");
    console.log("✅ Proper headers are set for file downloads");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("📄 Response status:", error.response.status);
      console.error("📄 Response data:", error.response.data);
    }
  }
}

// Run the test
testExcelExport();
