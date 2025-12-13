# GPS Implementation Guide

## Haversine Formula
We use the Haversine formula to calculate the great-circle distance between two points on a sphere given their longitudes and latitudes.

\`\`\`javascript
const R = 6371e3; // metres
const φ1 = lat1 * Math.PI/180;
const φ2 = lat2 * Math.PI/180;
const Δφ = (lat2-lat1) * Math.PI/180;
const Δλ = (lon2-lon1) * Math.PI/180;

const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

const d = R * c; // distance in metres
\`\`\`

## Spoofing Detection Strategy
1.  **Distance Check**: User must be within `radius` (15m) + `accuracy` buffer.
2.  **IP Validation**: (Optional) Check if request comes from Campus Wi-Fi/IP range.
3.  **Mock Location Flag**: Check browser/device flags if available (via Mobile app headers).
4.  **Velocity Check**: If user jumps long distances in short time (future implementation).

## Testing
*   Use Chrome DevTools -> Sensors to mock geolocation coordinates.
*   Test with coordinates close to session (success) and far away (fail).
