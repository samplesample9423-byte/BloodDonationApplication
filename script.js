// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const body = document.body;

// Theme Toggle
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    body.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}

// Mobile Menu
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Data Handling (Hybrid: API + LocalStorage)
const API_URL = 'http://localhost:3000/donors';
const REQUESTS_API_URL = 'http://localhost:3000/requests';
const ADMINS_API_URL = 'http://localhost:3000/admins';
const ACTIVITIES_API_URL = 'http://localhost:3000/activities';

// Check if server is reachable
let useLocalStorage = false;
async function checkServer() {
    try {
        await fetch(API_URL, { method: 'HEAD' });
        useLocalStorage = false;
        console.log('Connected to Server');
    } catch (e) {
        useLocalStorage = true;
        console.log('Server unreachable, using LocalStorage');
        initializeLocalStorage();
    }
}
checkServer();

function initializeLocalStorage() {
    if (!localStorage.getItem('donors')) localStorage.setItem('donors', '[]');
    if (!localStorage.getItem('requests')) localStorage.setItem('requests', '[]');
    if (!localStorage.getItem('activities')) localStorage.setItem('activities', '[]');
    if (!localStorage.getItem('admins')) {
        localStorage.setItem('admins', JSON.stringify([
            { id: '1', username: 'admin', password: '123' }
        ]));
    }
}

// Generic Data Helpers
async function getData(key, url) {
    if (useLocalStorage) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        useLocalStorage = true; // Fallback
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
}

async function saveData(key, url, data) {
    if (useLocalStorage) {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        items.push(data);
        localStorage.setItem(key, JSON.stringify(items));
        return data;
    }
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        useLocalStorage = true;
        saveData(key, url, data); // Retry locally
    }
}

async function updateData(key, url, id, data) {
    if (useLocalStorage) {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data };
            localStorage.setItem(key, JSON.stringify(items));
        }
    } else {
        try {
            await fetch(`${url}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            useLocalStorage = true;
            updateData(key, url, id, data);
        }
    }
}

async function deleteData(key, url, id) {
    if (useLocalStorage) {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
    } else {
        try {
            await fetch(`${url}/${id}`, { method: 'DELETE' });
        } catch (e) {
            useLocalStorage = true;
            deleteData(key, url, id);
        }
    }
}

async function getDonors() {
    return await getData('donors', API_URL);
}

async function getRequests() {
    return await getData('requests', REQUESTS_API_URL);
}

async function saveDonor(donor) {
    await saveData('donors', API_URL, donor);
}

async function saveRequest(request) {
    await saveData('requests', REQUESTS_API_URL, request);
}

async function deleteDonor(id) {
    await deleteData('donors', API_URL, id);
}

async function updateDonor(id, updatedDonor) {
    await updateData('donors', API_URL, id, updatedDonor);
}

// Helper to generate ID (simple random string)
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Contact Form Logic
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        contactForm.reset();
        showToast('Message sent successfully! We will get back to you soon.');
    });
}

// Registration Form Logic
const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const bloodGroup = document.getElementById('blood-group').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const city = document.getElementById('city').value;
        const lastDonation = document.getElementById('last-donation').value;

        // Simple Validation
        if (age < 18 || age > 65) {
            alert('Age must be between 18 and 65.');
            return;
        }

        if (phone.length !== 10) {
            alert('Please enter a valid 10-digit phone number.');
            return;
        }

        // For registration, we can optionally verify the email
        const verifyEmail = confirm('Would you like to verify your email address before completing registration?');
        
        if (verifyEmail) {
            const otpSent = await sendOTP(email);
            if (!otpSent) {
                alert('Failed to send verification email. Please try again.');
                return;
            }
            
            // Show OTP verification modal
            showOTPVerification(email, async () => {
                // OTP verified, now save the donor
                const donor = {
                    id: generateId(),
                    name,
                    age,
                    gender,
                    bloodGroup,
                    phone,
                    email,
                    city,
                    lastDonation
                };

                await saveDonor(donor);
                logActivity(`New donor registered: ${name} (${bloodGroup})`);
                registrationForm.reset();
                showToast('Registration successful! Thank you for being a donor. Your email has been verified.');
            });
        } else {
            // Register without email verification
            const donor = {
                id: generateId(),
                name,
                age,
                gender,
                bloodGroup,
                phone,
                email,
                city,
                lastDonation
            };

            await saveDonor(donor);
            logActivity(`New donor registered: ${name} (${bloodGroup})`);
            registrationForm.reset();
            showToast('Registration successful! Thank you for being a donor.');
        }
    });
}

// Admin Logic
const donorsTableBody = document.querySelector('#donors-table tbody');
const noDonorsMsg = document.getElementById('no-donors-msg');

// Admin Authentication Logic
const loginForm = document.getElementById('login-form');
const toggleLink = document.getElementById('toggle-auth');

if (toggleLink) {
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        const formTitle = document.querySelector('h2');
        const submitBtn = document.querySelector('.submit-btn');
        const isLogin = loginForm.dataset.mode !== 'signup';

        if (isLogin) {
            // Switch to Signup
            formTitle.innerText = 'Admin Sign Up';
            submitBtn.innerText = 'Sign Up';
            toggleLink.innerText = 'Already have an account? Login';
            loginForm.dataset.mode = 'signup';
        } else {
            // Switch to Login
            formTitle.innerText = 'Admin Login';
            submitBtn.innerText = 'Login';
            toggleLink.innerText = 'New Admin? Sign Up';
            loginForm.dataset.mode = 'login';
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const mode = loginForm.dataset.mode || 'login';

        if (mode === 'login') {
            try {
                let admins = await getData('admins', ADMINS_API_URL);
                const user = admins.find(u => u.username === username && u.password === password);

                if (user) {
                    sessionStorage.setItem('isAdmin', 'true');
                    sessionStorage.setItem('adminUser', username);
                    logActivity(`Admin logged in: ${username}`);
                    window.location.href = 'admin.html';
                } else {
                    alert('Invalid credentials!');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed.');
            }
        } else {
            // Sign Up
            try {
                // Check if username exists
                let admins = await getData('admins', ADMINS_API_URL);
                const existing = admins.find(u => u.username === username);
                
                if (existing) {
                    alert('Username already exists!');
                    return;
                }

                const newAdmin = { id: generateId(), username, password };
                await saveData('admins', ADMINS_API_URL, newAdmin);

                alert('Registration successful! Please login.');
                // Switch to login mode
                document.getElementById('toggle-auth').click();
            } catch (error) {
                console.error('Signup error:', error);
                alert('Registration failed.');
            }
        }
    });
}

// Check Auth for Admin Page
if (window.location.pathname.includes('admin.html')) {
    if (!sessionStorage.getItem('isAdmin')) {
        window.location.href = 'login.html';
    }
}

// Export to CSV
window.exportDonorsToCSV = async function() {
    const donors = await getDonors();
    if (donors.length === 0) {
        alert('No donors to export.');
        return;
    }

    const headers = ['Name', 'Age', 'Gender', 'Blood Group', 'Phone', 'Email', 'City', 'Last Donation'];
    const csvRows = [headers.join(',')];

    donors.forEach(donor => {
        const row = [
            `"${donor.name}"`,
            donor.age,
            donor.gender,
            donor.bloodGroup,
            `"${donor.phone}"`,
            `"${donor.email}"`,
            `"${donor.city}"`,
            donor.lastDonation
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'donors_list.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    logActivity('Admin exported donor list to CSV');
};

// Export to PDF
window.exportDonorsToPDF = async function() {
    const donors = await getDonors();
    if (donors.length === 0) {
        alert('No donors to export.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('BloodLink - Donor List', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Name", "Age", "Gender", "Blood Group", "City", "Phone", "Last Donation"];
    const tableRows = [];

    donors.forEach(donor => {
        const donorData = [
            donor.name,
            donor.age,
            donor.gender,
            donor.bloodGroup,
            donor.city,
            donor.phone,
            donor.lastDonation || 'N/A'
        ];
        tableRows.push(donorData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 53, 69] } // Primary color #dc3545
    });

    doc.save('donors_list.pdf');
    logActivity('Admin exported donor list to PDF');
};

// Activity Log Logic
async function logActivity(action) {
    const activity = {
        action: action,
        timestamp: new Date().toLocaleString()
    };
    
    try {
        await saveData('activities', ACTIVITIES_API_URL, activity);
        
        // Reload activities if on dashboard
        const activityList = document.getElementById('activity-log');
        if (activityList) {
            loadActivities();
        }
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

async function loadActivities() {
    const activityList = document.getElementById('activity-log');
    if (!activityList) return;

    try {
        const activities = await getData('activities', ACTIVITIES_API_URL);
        
        // Show last 10 activities, newest first
        const recentActivities = activities.slice(-10).reverse();
        
        activityList.innerHTML = recentActivities.map(act => `
            <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                <strong>${act.action}</strong><br>
                <small style="color: #888;">${act.timestamp}</small>
            </li>
        `).join('') || '<li style="color: #666;">No recent activity.</li>';
    } catch (error) {
        console.error('Error loading activities:', error);
        activityList.innerHTML = '<li style="color: red;">Error loading activities.</li>';
    }
}

// Logout Button Logic
function logout() {
    sessionStorage.removeItem('isAdmin');
    window.location.href = 'login.html';
}
window.logout = logout;

if (donorsTableBody) {
    loadDonorsTable();
    loadDashboardStats();
    loadRequestsTable();
    loadAdminsTable();
    loadDashboardChart();
    loadRequestsChart();
    loadActivities();
}

let bloodGroupChart = null;

async function loadDashboardChart() {
    const ctx = document.getElementById('bloodGroupChart');
    if (!ctx) return;

    const donors = await getDonors();
    
    // Count blood groups
    const counts = {
        'A+': 0, 'A-': 0, 
        'B+': 0, 'B-': 0, 
        'AB+': 0, 'AB-': 0, 
        'O+': 0, 'O-': 0
    };

    donors.forEach(donor => {
        if (counts[donor.bloodGroup] !== undefined) {
            counts[donor.bloodGroup]++;
        }
    });

    const data = Object.values(counts);
    const labels = Object.keys(counts);

    if (bloodGroupChart) {
        bloodGroupChart.destroy();
    }

    bloodGroupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Donors',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#E7E9ED', '#FF6384'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

let requestsChart = null;

async function loadRequestsChart() {
    const ctx = document.getElementById('requestsChart');
    if (!ctx) return;

    const requests = await getRequests();
    
    // Count requests by blood group
    const counts = {
        'A+': 0, 'A-': 0, 
        'B+': 0, 'B-': 0, 
        'AB+': 0, 'AB-': 0, 
        'O+': 0, 'O-': 0
    };

    requests.forEach(req => {
        if (counts[req.bloodGroup] !== undefined) {
            counts[req.bloodGroup]++;
        }
    });

    const data = Object.values(counts);
    const labels = Object.keys(counts);

    if (requestsChart) {
        requestsChart.destroy();
    }

    requestsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Requests',
                data: data,
                backgroundColor: '#dc3545',
                borderColor: '#c62828',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function loadDashboardStats() {
    const totalDonorsEl = document.getElementById('total-donors');
    const totalRequestsEl = document.getElementById('total-requests');
    const mostNeededEl = document.getElementById('most-needed');

    if (!totalDonorsEl) return;

    const donors = await getDonors();
    const requests = await getRequests();

    totalDonorsEl.innerText = donors.length;
    totalRequestsEl.innerText = requests.length;

    if (requests.length > 0) {
        // Calculate most needed blood group
        const groups = {};
        requests.forEach(req => {
            groups[req.bloodGroup] = (groups[req.bloodGroup] || 0) + 1;
        });
        
        const mostNeeded = Object.keys(groups).reduce((a, b) => groups[a] > groups[b] ? a : b);
        mostNeededEl.innerText = mostNeeded;
    } else {
        mostNeededEl.innerText = '-';
    }
}

async function loadAdminsTable() {
    const adminsTableBody = document.querySelector('#admins-table tbody');
    const noAdminsMsg = document.getElementById('no-admins-msg');
    
    if (!adminsTableBody) return;

    try {
        const admins = await getData('admins', ADMINS_API_URL);
        
        adminsTableBody.innerHTML = '';

        if (admins.length === 0) {
            if (noAdminsMsg) noAdminsMsg.style.display = 'block';
            return;
        } else {
            if (noAdminsMsg) noAdminsMsg.style.display = 'none';
        }

        const currentAdmin = sessionStorage.getItem('adminUser');

        admins.forEach(admin => {
            const row = document.createElement('tr');
            // Don't allow deleting yourself
            const deleteBtn = admin.username === currentAdmin 
                ? '<span style="color: #999;">(You)</span>' 
                : `<button class="action-btn delete-btn" onclick="deleteAdminHandler('${admin.id}')"><i class="fas fa-trash"></i></button>`;

            row.innerHTML = `
                <td>${admin.username}</td>
                <td>${admin.id}</td>
                <td>${deleteBtn}</td>
            `;
            adminsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

async function loadDonorsTable() {
    const donors = await getDonors();
    donorsTableBody.innerHTML = '';

    if (donors.length === 0) {
        if (noDonorsMsg) noDonorsMsg.style.display = 'block';
        return;
    } else {
        if (noDonorsMsg) noDonorsMsg.style.display = 'none';
    }

    donors.forEach(donor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donor.name}</td>
            <td>${donor.age}</td>
            <td>${donor.gender}</td>
            <td>${donor.bloodGroup}</td>
            <td>${donor.city}</td>
            <td>${donor.phone}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editDonor('${donor.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteDonorHandler('${donor.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        donorsTableBody.appendChild(row);
    });
}

async function loadRequestsTable() {
    const requestsTableBody = document.querySelector('#requests-table tbody');
    const noRequestsMsg = document.getElementById('no-requests-msg');
    
    if (!requestsTableBody) return;

    const requests = await getRequests();
    requestsTableBody.innerHTML = '';

    if (requests.length === 0) {
        if (noRequestsMsg) noRequestsMsg.style.display = 'block';
        return;
    } else {
        if (noRequestsMsg) noRequestsMsg.style.display = 'none';
    }

    requests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.name}</td>
            <td>${req.bloodGroup}</td>
            <td>${req.units}</td>
            <td>${req.city}</td>
            <td>${req.phone}</td>
            <td>${req.date}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editRequestHandler('${req.id}')" title="Edit Request"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteRequestHandler('${req.id}')" title="Mark as Resolved/Delete">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
        requestsTableBody.appendChild(row);
    });
}

// Make functions global so they can be called from HTML onclick
window.deleteDonorHandler = async function(id) {
    if (confirm('Are you sure you want to delete this donor?')) {
        await deleteDonor(id);
        logActivity('Admin deleted a donor');
        loadDonorsTable();
        loadDashboardStats();
        loadDashboardChart();
        showToast('Donor deleted successfully.');
    }
};

window.deleteAdminHandler = async function(id) {
    if (confirm('Are you sure you want to delete this admin?')) {
        try {
            await deleteData('admins', ADMINS_API_URL, id);
            loadAdminsTable();
            showToast('Admin deleted successfully.');
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert('Failed to delete admin.');
        }
    }
};

window.editRequestHandler = async function(id) {
    const requests = await getRequests();
    const request = requests.find(r => r.id === id);
    if (!request) return;

    const units = prompt('Edit Units Needed:', request.units);
    if (units === null) return;

    const date = prompt('Edit Date Needed:', request.date);
    const phone = prompt('Edit Contact Phone:', request.phone);

    if (units && date && phone) {
        request.units = units;
        request.date = date;
        request.phone = phone;

        try {
            await updateData('requests', REQUESTS_API_URL, id, request);
            loadRequestsTable();
            loadDashboardStats();
            showToast('Request updated.');
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Failed to update request.');
        }
    } else {
        alert('All fields are required!');
    }
};

window.deleteRequestHandler = async function(id) {
    if (confirm('Mark this request as resolved and remove it?')) {
        try {
            await deleteData('requests', REQUESTS_API_URL, id);
            logActivity('Admin deleted a blood request');
            loadRequestsTable();
            loadDashboardStats();
            loadRequestsChart();
            showToast('Request resolved.');
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Failed to delete request.');
        }
    }
};

window.editDonor = async function(id) {
    const donors = await getDonors();
    const donor = donors.find(d => d.id === id);
    if (!donor) return;

    // Simple prompt-based edit
    const name = prompt('Edit Name:', donor.name);
    if (name === null) return; // Cancelled
    
    const age = prompt('Edit Age:', donor.age);
    const city = prompt('Edit City:', donor.city);
    const phone = prompt('Edit Phone:', donor.phone);

    if (name && age && city && phone) {
        donor.name = name;
        donor.age = age;
        donor.city = city;
        donor.phone = phone;
        
        // Ask if user wants to update donation date with email verification
        const updateDonation = confirm('Do you want to update the last donation date? This will require email verification.');
        if (updateDonation) {
            const donationDate = prompt('Enter the new donation date (YYYY-MM-DD):');
            if (donationDate) {
                await updateDonationWithVerification(id, donor.email, donationDate);
                return; // Donor will be updated in the verification callback
            }
        }
        
        await updateDonor(id, donor);
        loadDonorsTable();
        showToast('Donor details updated.');
    } else {
        alert('All fields are required!');
    }
};

// Blood Compatibility Rules
const bloodCompatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
};

// Search Logic
const searchForm = document.getElementById('search-form');
const resultsSection = document.getElementById('results-section');
const resultsContainer = document.getElementById('results-container');

// Expose showAllDonors globally
window.showAllDonors = function() {
    if (searchForm) searchForm.reset();
    loadAllDonorsForSearch();
};

if (searchForm) {
    // Load all donors initially
    loadAllDonorsForSearch();

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bloodGroup = document.getElementById('search-blood-group').value;
        const city = document.getElementById('search-city').value.toLowerCase().trim();
        const showCompatible = document.getElementById('search-compatible').checked;
        
        const donors = await getDonors();
        
        const matchingDonors = donors.filter(donor => {
            // Blood Group Logic
            let matchGroup = false;
            if (!bloodGroup) {
                matchGroup = true; // No group selected, show all
            } else if (showCompatible) {
                // Check if donor's group is in the compatible list for the patient (searchGroup)
                // Note: The logic here depends on who is searching.
                // If I am a PATIENT needing A+, I need donors compatible with A+ (A+, A-, O+, O-).
                // If I am a DONOR looking to donate, I need patients compatible with me.
                // Assumption: User is looking for DONORS. So user input is "Patient's Blood Group" or "Target Blood Group".
                // If user selects "A+", they want A+ blood. So we show A+, A-, O+, O- donors.
                const compatibleGroups = bloodCompatibility[bloodGroup] || [bloodGroup];
                matchGroup = compatibleGroups.includes(donor.bloodGroup);
            } else {
                matchGroup = donor.bloodGroup === bloodGroup;
            }

            const matchCity = !city || donor.city.toLowerCase().includes(city);
            return matchGroup && matchCity;
        });
        
        displayResults(matchingDonors);
    });
}

async function loadAllDonorsForSearch() {
    const donors = await getDonors();
    displayResults(donors);
}

function displayResults(donors) {
    resultsSection.style.display = 'block';
    resultsContainer.innerHTML = '';
    
    if (donors.length === 0) {
        resultsContainer.innerHTML = '<p>No donors found matching your criteria.</p>';
        return;
    }
    
    donors.forEach(donor => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.style.width = '100%';
        card.style.maxWidth = '300px';
        card.style.textAlign = 'left';
        card.style.margin = '0';
        
        // WhatsApp Link
        const waLink = `https://wa.me/${donor.phone}?text=Hello ${donor.name}, I found you on the Blood Donation Web. I have a blood emergency.`;
        
        card.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <i class="fas fa-user-circle" style="font-size: 3rem; color: var(--primary-color);"></i>
            </div>
            <h4>${donor.name}</h4>
            <p><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
            <p><strong>Age:</strong> ${donor.age}</p>
            <p><strong>Gender:</strong> ${donor.gender}</p>
            <p><strong>City:</strong> ${donor.city}</p>
            <p><strong>Phone:</strong> ${donor.phone}</p>
            <p><strong>Last Donation:</strong> ${donor.lastDonation || 'N/A'}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <a href="tel:${donor.phone}" class="btn btn-primary" style="flex: 1; text-align: center;"><i class="fas fa-phone"></i> Call</a>
                <a href="${waLink}" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center; background-color: #25D366; border-color: #25D366;"><i class="fab fa-whatsapp"></i> Chat</a>
            </div>
        `;
        
        resultsContainer.appendChild(card);
    });
}

// Request Form Logic
const requestForm = document.getElementById('request-form');
const requestsList = document.getElementById('requests-list');

if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('req-name').value;
        const bloodGroup = document.getElementById('req-blood-group').value;
        const units = document.getElementById('req-units').value;
        const city = document.getElementById('req-city').value;
        const phone = document.getElementById('req-phone').value;
        const date = document.getElementById('req-date').value;

        if (phone.length !== 10) {
            alert('Please enter a valid 10-digit phone number.');
            return;
        }

        const request = {
            id: generateId(),
            name,
            bloodGroup,
            units,
            city,
            phone,
            date
        };

        await saveRequest(request);
        logActivity(`New blood request: ${name} needs ${units} units of ${bloodGroup}`);
        requestForm.reset();
        showToast('Blood request posted successfully!');
        loadRequests();
    });
}

if (requestsList) {
    loadRequests();
}

async function loadRequests() {
    if (!requestsList) return;
    
    const requests = await getRequests();
    requestsList.innerHTML = '';

    if (requests.length === 0) {
        requestsList.innerHTML = '<p>No active blood requests.</p>';
        return;
    }

    requests.forEach(req => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.style.width = '100%';
        card.style.maxWidth = '300px';
        card.style.textAlign = 'left';
        card.style.margin = '0';
        card.style.borderLeft = '5px solid var(--primary-color)';

        // WhatsApp Link for Requests
        const waLink = `https://wa.me/${req.phone}?text=Hello, I saw your blood request for ${req.bloodGroup} in ${req.city}. I can help.`;

        card.innerHTML = `
            <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">${req.bloodGroup} Blood Needed</h4>
            <p><strong>Patient:</strong> ${req.name}</p>
            <p><strong>Units:</strong> ${req.units}</p>
            <p><strong>Location:</strong> ${req.city}</p>
            <p><strong>Date Needed:</strong> ${req.date}</p>
            <p><strong>Contact:</strong> ${req.phone}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <a href="tel:${req.phone}" class="btn btn-primary" style="flex: 1; text-align: center;"><i class="fas fa-phone"></i> Call</a>
                <a href="${waLink}" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center; background-color: #25D366; border-color: #25D366;"><i class="fab fa-whatsapp"></i> Chat</a>
            </div>
        `;
        requestsList.appendChild(card);
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Email Verification System
let otpStore = {}; // In-memory storage for OTPs (in production, use a proper database)

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to email (simulated)
async function sendOTP(email) {
    const otp = generateOTP();
    otpStore[email] = {
        otp: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // OTP expires in 10 minutes
    };
    
    // In a real application, you would send the OTP via email here
    // For simulation purposes, we'll just log it to the console
    console.log(`OTP for ${email}: ${otp}`);
    alert(`OTP sent to ${email}. For testing purposes, the OTP is: ${otp}\nIn a real application, this would be sent to your email.`);
    
    return true;
}

// Verify OTP
function verifyOTP(email, otp) {
    const stored = otpStore[email];
    if (!stored) {
        return { success: false, message: "No OTP found for this email." };
    }
    
    if (stored.expiresAt < new Date()) {
        delete otpStore[email]; // Remove expired OTP
        return { success: false, message: "OTP has expired. Please request a new one." };
    }
    
    if (stored.otp === otp) {
        delete otpStore[email]; // Remove used OTP
        return { success: true, message: "OTP verified successfully." };
    }
    
    return { success: false, message: "Invalid OTP. Please try again." };
}

// Show OTP verification modal
function showOTPVerification(email, onVerifiedCallback) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px; text-align: center;">
            <h3>Email Verification</h3>
            <p>A 6-digit OTP has been sent to: <strong>${email}</strong></p>
            <div style="margin: 1rem 0;">
                <input type="text" id="otp-input" placeholder="Enter 6-digit OTP" maxlength="6" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: center;">
                <button id="verify-otp-btn" style="padding: 0.5rem 1rem; background-color: var(--primary-color, #d32f2f); color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>
                <button id="resend-otp-btn" style="padding: 0.5rem 1rem; background-color: #f5f5f5; color: #333; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Resend OTP</button>
            </div>
            <button id="cancel-otp-btn" style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: #f5f5f5; color: #333; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const otpInput = document.getElementById('otp-input');
    const verifyBtn = document.getElementById('verify-otp-btn');
    const resendBtn = document.getElementById('resend-otp-btn');
    const cancelBtn = document.getElementById('cancel-otp-btn');
    
    verifyBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();
        if (!otp) {
            alert('Please enter the OTP');
            return;
        }
        
        const result = verifyOTP(email, otp);
        if (result.success) {
            showToast(result.message);
            document.body.removeChild(modal);
            onVerifiedCallback();
        } else {
            alert(result.message);
        }
    });
    
    resendBtn.addEventListener('click', async () => {
        const result = await sendOTP(email);
        if (result) {
            showToast('OTP resent successfully');
            otpInput.value = '';
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    otpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyBtn.click();
        }
    });
}

// Function to update donor's last donation date with email verification
async function updateDonationWithVerification(donorId, email, donationDate) {
    // First send OTP to the donor's email
    const otpSent = await sendOTP(email);
    if (!otpSent) {
        alert('Failed to send verification email. Please try again.');
        return false;
    }
    
    // Show OTP verification modal
    showOTPVerification(email, async () => {
        // OTP verified, now update the donor's last donation date
        try {
            // Get current donor data
            const donors = await getDonors();
            const donor = donors.find(d => d.id === donorId);
            
            if (!donor) throw new Error('Donor not found');

            // Update the last donation date
            const updatedDonor = {
                ...donor,
                lastDonation: donationDate
            };
            
            await updateDonor(donorId, updatedDonor);
            logActivity(`Donor ${donor.name} updated last donation date after email verification`);
            showToast('Donation record updated successfully after email verification!');
            
            // Reload donor table if on admin page
            if (donorsTableBody) {
                loadDonorsTable();
            }
        } catch (error) {
            console.error('Error updating donor:', error);
            alert('Failed to update donation record.');
        }
    });
    
    return true;
}

// Add function to allow donors to update their donation status with verification
window.updateDonationStatus = function(donorId, email) {
    const donationDate = prompt('Enter the date of your blood donation (YYYY-MM-DD):');
    if (!donationDate) return; // User cancelled
    
    updateDonationWithVerification(donorId, email, donationDate);
};
