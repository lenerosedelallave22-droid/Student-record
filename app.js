const fs = require("fs");

let students;
try {
  const raw = fs.readFileSync("students.json", "utf8");
  students = JSON.parse(raw);
  if (!Array.isArray(students)) throw new Error("Not an array");
} catch (err) {
  console.error("❌ Failed to load students.json");
  process.exit(1);
}

// ==================================================
// FUNCTIONS
// ==================================================

function getAverageGrade(student) {
  if (!student || !Array.isArray(student.grades) || student.grades.length === 0) return 0;
  const total = student.grades.reduce((sum, g) => sum + g, 0);
  return parseFloat((total / student.grades.length).toFixed(2));
}

function getTopStudents(studentsArr, n) {
  if (n < 0) throw new Error("Error: Number of students cannot be negative");
  if (!Number.isInteger(n)) throw new Error("Error: n must be an integer");
  if (studentsArr.length === 0 || n === 0) return [];
  return [...studentsArr]
    .sort((a, b) => getAverageGrade(b) - getAverageGrade(a))
    .slice(0, n);
}

function groupByCourse(studentsArr) {
  return studentsArr.reduce((groups, s) => {
    if (!groups[s.course]) groups[s.course] = [];
    groups[s.course].push(s);
    return groups;
  }, {});
}

function getEnrolledCount(studentsArr) {
  const enrolled = studentsArr.filter(s => s.enrolled).length;
  const notEnrolled = studentsArr.filter(s => !s.enrolled).length;
  return { enrolled, notEnrolled };
}

function findStudent(studentsArr, name) {
  if (!name || name.trim() === "") return null;
  const search = name.toLowerCase().trim();
  return studentsArr.find(s => s.name.toLowerCase().includes(search)) || null;
}

function getCourseAverages(studentsArr) {
  const grouped = groupByCourse(studentsArr);
  return Object.entries(grouped).map(([course, list]) => {
    const avgSum = list.reduce((sum, s) => sum + getAverageGrade(s), 0);
    return { course, average: parseFloat((avgSum / list.length).toFixed(2)) };
  }).sort((a, b) => b.average - a.average);
}

function exportSummary(studentsArr) {
  const totalStudents = studentsArr.length;
  const overallAvg = studentsArr.length === 0
    ? 0
    : parseFloat((studentsArr.reduce((sum, s) => sum + getAverageGrade(s), 0) / studentsArr.length).toFixed(2));

  return {
    totalStudents,
    overallAverage: overallAvg,
    topStudent: (() => {
      const top = getTopStudents(studentsArr, 1)[0];
      if (!top) return null;
      return {
        id: top.id,
        name: top.name,
        year: top.year,
        course: top.course,
        grades: top.grades,
        enrolled: top.enrolled
      };
    })(),
    top3Students: getTopStudents(studentsArr, 3).map(s => ({
      id: s.id,
      name: s.name,
      course: s.course,
      average: getAverageGrade(s)
    })),
    courseBreakdown: getCourseAverages(studentsArr),
    enrollmentStatus: getEnrolledCount(studentsArr)
  };
}

function divider(title) {
  console.log("\n" + "=".repeat(50));
  console.log(`  ${title}`);
  console.log("=".repeat(50));
}

// ==================================================
// MAIN
// ==================================================
function main() {
  divider("📊 STUDENT RECORDS REPORT — 15 STUDENTS");

  console.log(`Total Students: ${students.length}`);

  divider("📋 ENROLLMENT STATUS");
  const status = getEnrolledCount(students);
  console.log(`Enrolled:     ${status.enrolled}`);
  console.log(`Not Enrolled: ${status.notEnrolled}`);

  divider("🏆 TOP 3 STUDENTS");
  const top3 = getTopStudents(students, 3);
  top3.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} | ${s.course} | Avg: ${getAverageGrade(s)}`);
  });

  divider("🔍 STUDENT SEARCH");
  const searchName = "Lim";
  const found = findStudent(students, searchName);
  if (found) {
    console.log(`Found: "${searchName}"`);
    console.log(`  Name   : ${found.name}`);
    console.log(`  Course : ${found.course}`);
    console.log(`  Year   : ${found.year}`);
    console.log(`  Avg    : ${getAverageGrade(found)}`);
  } else {
    console.log(`"${searchName}" not found.`);
  }

  const notFound = findStudent(students, "Ghost Student");
  console.log(`\nSearch "Ghost Student": ${notFound ? "Found" : "Not Found"}`);

  divider("💾 EXPORTING report.json");
  try {
    const summary = exportSummary(students);
    fs.writeFileSync("report.json", JSON.stringify(summary, null, 2));
    console.log("report.json written successfully ✅");
  } catch (err) {
    console.error("Failed to write report.json ❌");
  }

  divider("🛡️ INPUT VALIDATION DEMO");
  try {
    getTopStudents(students, -1);
  } catch (err) {
    console.log(`getTopStudents(students, -1): ${err.message}`);
  }
  try {
    getTopStudents(students, 2.5);
  } catch (err) {
    console.log(`getTopStudents(students, 2.5): ${err.message}`);
  }

  divider("⚠️ EDGE CASES");
  console.log(`getAverageGrade({ grades: [] }): ${getAverageGrade({ grades: [] })}`);
  console.log(`getTopStudents([], 3):`, getTopStudents([], 3));
  console.log(`findStudent([], 'Anyone'):`, findStudent([], "Anyone"));
  console.log(`getEnrolledCount([]):`, getEnrolledCount([]));

  console.log("\n\n        END OF REPORT");
}

main();
    
