# Smart Campus - Analytics Guide

## Overview

The Analytics module provides data-driven insights for administrators to monitor and improve campus operations. Access via **Admin → Analytics**.

---

## 1. Admin Dashboard

**Location:** `/admin/dashboard`

The main dashboard provides a quick overview:

| Metric | Description |
|--------|-------------|
| **Total Users** | All registered accounts |
| **Active Today** | Users who logged in today |
| **Total Courses** | Courses in catalog |
| **Total Enrollments** | Active course registrations |
| **Attendance Rate** | Overall % across all sessions |
| **Meal Reservations Today** | Cafeteria bookings |
| **Upcoming Events** | Events in next 7 days |
| **System Health** | API and DB status |

---

## 2. Academic Performance Analytics

**Location:** `/admin/analytics/academic`

### Metrics Available

| Chart/Table | Shows |
|-------------|-------|
| **GPA Distribution** | Histogram of student GPAs |
| **Grade Distribution** | Pie chart (A/B/C/D/F percentages) |
| **Pass/Fail Rates** | Per course success rates |
| **Department Comparison** | Average GPA by department |
| **At-Risk Students** | Students with GPA < 2.0 |
| **Top Performers** | Students with GPA > 3.5 |

### How to Use

1. Select department filter (optional)
2. Select semester
3. View charts and tables
4. Click "Export" for Excel/PDF

### Interpretation

- **At-Risk Alert**: Students appearing here need academic advising
- **Course Analysis**: Low pass rates may indicate curriculum issues
- **Trend Analysis**: Compare semesters to identify patterns

---

## 3. Attendance Analytics

**Location:** `/admin/analytics/attendance`

### Metrics Available

| Visualization | Shows |
|--------------|-------|
| **Line Chart** | Attendance trends over semester |
| **Bar Chart** | Attendance rate by course |
| **Heat Map** | Attendance by day of week |
| **Critical List** | Students with >20% absence |
| **Course Comparison** | Lowest attending courses |

### Alerts

- 🔴 **Critical**: Student has >30% absence
- 🟡 **Warning**: Student has 20-30% absence
- 🟢 **Good**: Student has <20% absence

### Actions

1. Identify struggling students early
2. Contact students via notification system
3. Review instructor engagement methods
4. Adjust class schedules if patterns emerge

---

## 4. Meal & Cafeteria Analytics

**Location:** `/admin/analytics/meal`

### Metrics Available

| Chart | Shows |
|-------|-------|
| **Daily Usage** | Lunch vs Dinner reservations |
| **Weekly Trend** | Reservation patterns |
| **Peak Hours Heat Map** | Busiest times |
| **Cafeteria Utilization** | % of capacity used |
| **Revenue (if paid)** | Daily/weekly income |
| **No-Show Rate** | Reserved but unused |

### Business Insights

- **Peak Planning**: Staff more workers during busy hours
- **Menu Optimization**: Popular items vs unpopular
- **Waste Reduction**: Track no-show patterns
- **Capacity Planning**: Expand high-demand cafeterias

---

## 5. Event Analytics

**Location:** `/admin/analytics/events`

### Metrics Available

| Metric | Description |
|--------|-------------|
| **Popular Events** | Ranked by registration count |
| **Category Breakdown** | Seminar vs Social vs Academic |
| **Registration Rate** | % of capacity filled |
| **Check-in Rate** | Registered vs Actually attended |
| **Time Preference** | Popular event times |

### Event Success Formula

```
Success Score = (Check-ins / Registrations) × 100
```

- **>80%**: Highly successful
- **60-80%**: Good
- **<60%**: Review event format

---

## 6. IoT & Sensor Analytics (Bonus)

**Location:** `/admin/iot`

### Available Sensors

| Type | Readings | Use Case |
|------|----------|----------|
| Temperature | °C | HVAC monitoring |
| Occupancy | Count | Space utilization |
| Energy | kWh | Consumption tracking |

### Features

- Real-time streaming updates
- Historical charts (daily/weekly)
- Anomaly alerts
- Threshold configuration

---

## 7. Exporting Reports

### Available Formats

| Format | Best For |
|--------|----------|
| **Excel (.xlsx)** | Data analysis, pivot tables |
| **PDF** | Printing, sharing |
| **CSV** | Data import to other systems |

### How to Export

1. Navigate to any Analytics page
2. Set date range and filters
3. Click "Export" button (top right)
4. Select format
5. Download begins automatically

### Report Contents

- Summary statistics
- Charts (in PDF)
- Raw data (in Excel/CSV)
- Generated timestamp
- Filter parameters

---

## 8. Custom Reports (Advanced)

For custom analytics needs:

1. Use the API directly:
   ```
   GET /api/v1/analytics/export/:type?format=json
   ```

2. Connect BI tools (Power BI, Tableau) to the database

3. Request custom reports from IT department

---

## 9. Best Practices

1. **Regular Review**: Check dashboards weekly
2. **Set Alerts**: Configure email notifications for critical thresholds
3. **Compare Periods**: Use semester-over-semester comparison
4. **Take Action**: Analytics are useless without follow-up
5. **Share Insights**: Export and share with department heads

---

## 10. Glossary

| Term | Definition |
|------|------------|
| GPA | Grade Point Average (4.0 scale) |
| Attendance Rate | (Present + Late) / Total Sessions × 100 |
| Utilization | Used Capacity / Total Capacity × 100 |
| No-Show | Reserved but not used |
| Check-in Rate | Attended / Registered × 100 |
