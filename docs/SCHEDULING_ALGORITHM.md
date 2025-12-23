# Scheduling Algorithm Documentation (CSP)

## Overview
The Course Scheduling feature utilizes a **Constraint Satisfaction Problem (CSP)** approach solved via a **Backtracking Algorithm** with heuristics. It assigns course sections to classrooms and time slots while satisfying hard constraints and optimizing for soft constraints.

## Problem Definition
- **Variables**: Course Sections (requires Room, Time)
- **Domain**: Cartesian Product of (Available Classrooms × Time Slots)
- **Constraints**:
    - Hard (Must be satisfied)
    - Soft (Preferences/Optimization)

## Constraints

### Hard Constraints
1.  **Room Capacity**: The classroom capacity must be greater than or equal to the section capacity.
    - `Classroom.capacity >= Section.capacity`
2.  **No Double Booking (Room)**: A classroom cannot host two sections at the same time.
3.  **No Double Booking (Instructor)**: An instructor cannot teach two sections at the same time.
4.  **Time Overlap Logic**: Two slots overlap if they are on the same day and their time intervals intersect.

### Soft Constraints (Score Heuristics)
The algorithm calculates a score (higher is better) for valid assignments to guide the solution quality:
1.  **Minimize Instructor Gaps**: Penalize schedules where an instructor has large gaps (> 60 mins) between consecutive classes on the same day.
2.  **Compact Schedule**: Bonus points for consecutive classes (small gaps).

## Algorithm: Backtracking with Heuristics

### Pseudocode

```javascript
function solve(variables, classrooms, currentAssignment):
    // 1. Base Case: All variables assigned
    if (currentAssignment is complete):
        return currentAssignment

    // 2. Variable Selection (MRV - Minimum Remaining Values)
    var = selectUnassignedVariable(variables)

    // 3. Domain Generation
    domain = generatePossibleValues(var, classrooms) 
             // Filters out room capacity < var capacity immediately

    // 4. Try Values
    for value in domain:
        if isConsistent(var, value, currentAssignment):
            // Assign
            currentAssignment[var] = value
            
            // Recurse
            result = solve(variables, classrooms, currentAssignment)
            if (result != failure):
                return result
            
            // Backtrack
            remove(var, currentAssignment)

    return failure
```

### Time Slot Configuration
The system supports flexible time slot preferences:
- **Morning**: 08:00 - 12:50
- **Afternoon**: 13:00 - 17:50
- **Any**: Full day range

## Implementation Details
- **File**: `backend/src/services/scheduling.service.js`
- **Method**: `generateSchedule(semester, options)`
- **Optimization**: The solver returns the *first valid* solution found. Future improvements could include searching for the *optimal* solution (highest score) within a time limit or using Genetic Algorithms for larger datasets.

## Performance Considerations
- **Pre-filtering**: Classrooms smaller than section capacity are removed from the domain before iteration.
- **Fail-Fast**: The constraints checker (`isConsistent`) fails immediately on the first conflict found.
