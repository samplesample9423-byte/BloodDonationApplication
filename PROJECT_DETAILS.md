# Blood Donation Management System - Project Documentation

## 1. Project Overview
**BloodLink** is a web-based Blood Donation Management System designed to bridge the gap between blood donors and those in need. The application allows users to register as donors, search for compatible donors by blood group and city, and post blood requests. It also features a comprehensive Admin Dashboard for managing donors, requests, and viewing system analytics.

## 2. Technical Architecture
The project is built using a modern, lightweight tech stack:

*   **Frontend**: HTML5, CSS3 (Custom styling with responsive design), JavaScript (ES6+).
*   **Backend / Database**: `json-server` (A full fake REST API) used to mock a backend database.
*   **Hybrid Storage System**: Automatically switches between `json-server` (if online) and `localStorage` (offline/demo mode). This allows the app to be hosted on GitHub Pages without backend errors.
*   **Data Storage**: `db.json` (Server mode) or Browser LocalStorage (Offline mode).
*   **External Libraries**:
    *   *Chart.js*: For data visualization (Blood Group Distribution, Request Analytics).
    *   *jsPDF*: For generating downloadable PDF reports of donor lists.
    *   *FontAwesome*: For UI icons.

## 3. Key Features

### A. User Features (Public)
1.  **Donor Registration**:
    *   Users can sign up with personal details (Name, Age, Blood Group, Contact, City).
    *   Includes form validation (Age check, Phone number format).
    *   **Email Verification Simulation**: A simulated OTP system verifies emails before registration or updates.
2.  **Find Donor**:
    *   Search interface to filter donors by **Blood Group** and **City**.
    *   "Smart Search": Optionally shows compatible blood groups (e.g., if looking for A+, it shows A+, A-, O+, O-).
    *   **Direct Contact**: Integration with WhatsApp and Phone dialer for immediate communication.
3.  **Request Blood**:
    *   Users can post emergency blood requests visible to the community.
4.  **Responsive Design**: Works seamlessly on desktops, tablets, and mobile devices.

### B. Admin Features (Protected)
1.  **Dashboard**:
    *   **Real-time Stats**: Total Donors, Active Requests, Most Needed Blood Group.
    *   **Visual Analytics**:
        *   *Doughnut Chart*: Distribution of registered donors by blood group.
        *   *Bar Chart*: Analysis of current blood requests.
    *   **Activity Log**: Tracks system events (Logins, New Registrations, Deletions).
2.  **Donor Management**:
    *   View full list of donors.
    *   Edit donor details.
    *   Delete donors.
    *   **Export Data**: Download donor lists as **CSV** or **PDF**.
3.  **Request Management**:
    *   View, Edit, and Mark requests as "Resolved" (Delete).

## 4. File Structure
```
blood-donation-web/
├── index.html          # Landing page
├── register.html       # Donor registration form
├── search.html         # Search interface for finding donors
├── request.html        # Form to post blood requests
├── admin.html          # Admin dashboard (Protected)
├── login.html          # Admin login/signup page
├── contact.html        # Contact form
├── style.css           # Global styles and responsive layout
├── script.js           # Core application logic (API calls, UI handling)
├── db.json             # JSON database (Stores Donors, Requests, Admins)
└── package.json        # Project dependencies (json-server)
```

## 5. Setup & Installation
1.  **Prerequisites**: Ensure Node.js is installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start Backend Server**:
    ```bash
    npm start
    ```
    *This runs `json-server` on port 3000.*
4.  **Run Application**: Open `index.html` in your web browser (e.g., using Live Server or double-clicking the file).

## 6. API Endpoints
The application communicates with the local server via:
*   `GET /donors`: Fetch all donors.
*   `POST /donors`: Register a new donor.
*   `GET /requests`: Fetch active blood requests.
*   `POST /requests`: Create a new request.
*   `GET /admins`: Admin authentication check.

## 7. Future Scope
*   **Real Backend**: Migrate from `json-server` to Node.js/Express + MongoDB.
*   **Real SMS/Email**: Integrate Twilio or SendGrid for actual OTP delivery.
*   **Geolocation**: Use Maps API to show donors on a map based on real-time location.
