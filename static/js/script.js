(function() {
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = '123';

    function showToast(message, type) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'success') toast.classList.add('toast-success');
        if (type === 'error') toast.classList.add('toast-error');
        toast.innerText = message;
        document.body.appendChild(toast);
        requestAnimationFrame(function() {
            toast.classList.add('show');
        });
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 3000);
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getLocal(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function setLocal(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getDonors() {
        return getLocal('donors', []);
    }

    function saveDonors(donors) {
        setLocal('donors', donors);
    }

    function getRequests() {
        return getLocal('requests', []);
    }

    function saveRequests(requests) {
        setLocal('requests', requests);
    }

    function getActivityLog() {
        return getLocal('activityLog', []);
    }

    function saveActivityLog(entries) {
        setLocal('activityLog', entries);
    }

    function logActivity(message) {
        const log = getActivityLog();
        log.unshift({
            id: Date.now().toString(36),
            message: message,
            time: new Date().toLocaleString()
        });
        while (log.length > 100) log.pop();
        saveActivityLog(log);
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function applySavedTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    function setupThemeToggle() {
        applySavedTheme();
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.addEventListener('click', function() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    function setupHamburger() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        if (!hamburger || !navLinks) return;
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function() {
                navLinks.classList.remove('active');
            });
        });
    }

    function initRegistrationPage() {
        const form = document.getElementById('registration-form');
        if (!form) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const age = parseInt(document.getElementById('age').value, 10);
            const gender = document.getElementById('gender').value;
            const bloodGroup = document.getElementById('blood-group').value;
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();
            const city = document.getElementById('city').value.trim();
            const lastDonation = document.getElementById('last-donation').value;

            if (!name || !gender || !bloodGroup || !phone || !email || !city || !age) {
                showToast('Please fill all required fields.', 'error');
                return;
            }
            if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
                showToast('Please enter a valid 10-digit phone number.', 'error');
                return;
            }
            if (age < 18 || age > 65) {
                showToast('Age must be between 18 and 65.', 'error');
                return;
            }

            const donors = getDonors();
            const donor = {
                id: generateId(),
                name: name,
                age: age,
                gender: gender,
                bloodGroup: bloodGroup,
                phone: phone,
                email: email,
                city: city,
                lastDonation: lastDonation || ''
            };
            donors.push(donor);
            saveDonors(donors);
            logActivity('New donor registered: ' + name + ' (' + bloodGroup + ')');
            form.reset();
            showToast('Registration successful! Thank you for being a donor.', 'success');
        });
    }

    const bloodCompatibility = {
        'A+': ['A+', 'A-', 'O+', 'O-'],
        'A-': ['A-', 'O-'],
        'B+': ['B+', 'B-', 'O+', 'O-'],
        'B-': ['B-', 'O-'],
        'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        'AB-': ['A-', 'B-', 'AB-', 'O-'],
        'O+': ['O+', 'O-'],
        'O-': ['O-']
    };

    function initSearchPage() {
        const form = document.getElementById('search-form');
        const resultsSection = document.getElementById('results-section');
        const resultsContainer = document.getElementById('results-container');
        if (!form || !resultsSection || !resultsContainer) return;

        function displayResults(donors) {
            resultsSection.style.display = 'block';
            resultsContainer.innerHTML = '';
            if (donors.length === 0) {
                resultsContainer.innerHTML = '<p>No donors found matching your criteria.</p>';
                return;
            }
            donors.forEach(function(donor) {
                const card = document.createElement('div');
                card.className = 'feature-card';
                card.style.width = '100%';
                card.style.maxWidth = '300px';
                card.style.textAlign = 'left';
                card.style.margin = '0';
                const waLink = 'https://wa.me/' + encodeURIComponent(donor.phone) + '?text=Hello ' + encodeURIComponent(donor.name) + ', I found you on the Blood Donation Web. I have a blood emergency.';
                card.innerHTML =
                    '<div style="text-align: center; margin-bottom: 1rem;">' +
                    '<i class="fas fa-user-circle" style="font-size: 3rem; color: var(--primary-color);"></i>' +
                    '</div>' +
                    '<h4>' + escapeHtml(donor.name) + '</h4>' +
                    '<p><strong>Blood Group:</strong> ' + escapeHtml(donor.bloodGroup) + '</p>' +
                    '<p><strong>Age:</strong> ' + escapeHtml(donor.age) + '</p>' +
                    '<p><strong>Gender:</strong> ' + escapeHtml(donor.gender) + '</p>' +
                    '<p><strong>City:</strong> ' + escapeHtml(donor.city) + '</p>' +
                    '<p><strong>Phone:</strong> ' + escapeHtml(donor.phone) + '</p>' +
                    '<p><strong>Last Donation:</strong> ' + escapeHtml(donor.lastDonation || 'N/A') + '</p>' +
                    '<div style="display: flex; gap: 0.5rem; margin-top: 1rem;">' +
                    '<a href="tel:' + donor.phone + '" class="btn btn-primary" style="flex:1; text-align:center;">Call</a>' +
                    '<a href="' + waLink + '" target="_blank" class="btn btn-secondary" style="flex:1; text-align:center; background:#25D366; color:white; border:none;">WhatsApp</a>' +
                    '</div>';
                resultsContainer.appendChild(card);
            });
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const bloodGroup = document.getElementById('search-blood-group').value;
            const city = document.getElementById('search-city').value.trim().toLowerCase();
            const showCompatible = document.getElementById('search-compatible').checked;
            const donors = getDonors();
            const filtered = donors.filter(function(donor) {
                let matchGroup = false;
                if (!bloodGroup) {
                    matchGroup = true;
                } else if (showCompatible) {
                    const compatible = bloodCompatibility[bloodGroup] || [bloodGroup];
                    matchGroup = compatible.indexOf(donor.bloodGroup) !== -1;
                } else {
                    matchGroup = donor.bloodGroup === bloodGroup;
                }
                const matchCity = !city || (donor.city && donor.city.toLowerCase().indexOf(city) !== -1);
                return matchGroup && matchCity;
            });
            displayResults(filtered);
        });

        window.showAllDonors = function() {
            const donors = getDonors();
            displayResults(donors);
        };
    }

    function initRequestPage() {
        const form = document.getElementById('request-form');
        const list = document.getElementById('requests-list');
        if (!form || !list) return;

        function renderRequests() {
            const requests = getRequests();
            list.innerHTML = '';
            if (requests.length === 0) {
                list.innerHTML = '<p>No active blood requests.</p>';
                return;
            }
            requests.forEach(function(req) {
                const card = document.createElement('div');
                card.className = 'feature-card';
                card.style.width = '100%';
                card.style.maxWidth = '320px';
                card.style.textAlign = 'left';
                const waLink = 'https://wa.me/' + encodeURIComponent(req.phone) + '?text=I saw your blood request for ' + encodeURIComponent(req.bloodGroup) + ' on BloodLink.';
                card.innerHTML =
                    '<h4>' + escapeHtml(req.name) + '</h4>' +
                    '<p><strong>Blood Group:</strong> ' + escapeHtml(req.bloodGroup) + '</p>' +
                    '<p><strong>Units:</strong> ' + escapeHtml(req.units) + '</p>' +
                    '<p><strong>City/Hospital:</strong> ' + escapeHtml(req.city) + '</p>' +
                    '<p><strong>Contact:</strong> ' + escapeHtml(req.phone) + '</p>' +
                    '<p><strong>Date:</strong> ' + escapeHtml(req.date) + '</p>' +
                    '<div style="display:flex; gap:0.5rem; margin-top:1rem;">' +
                    '<a href="tel:' + req.phone + '" class="btn btn-primary" style="flex:1; text-align:center;">Call</a>' +
                    '<a href="' + waLink + '" target="_blank" class="btn btn-secondary" style="flex:1; text-align:center; background:#25D366; color:white; border:none;">WhatsApp</a>' +
                    '</div>';
                list.appendChild(card);
            });
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('req-name').value.trim();
            const bloodGroup = document.getElementById('req-blood-group').value;
            const units = parseInt(document.getElementById('req-units').value, 10);
            const city = document.getElementById('req-city').value.trim();
            const phone = document.getElementById('req-phone').value.trim();
            const date = document.getElementById('req-date').value;

            if (!name || !bloodGroup || !units || !city || !phone || !date) {
                showToast('Please fill all fields.', 'error');
                return;
            }
            if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
                showToast('Please enter a valid 10-digit phone number.', 'error');
                return;
            }

            const requests = getRequests();
            requests.unshift({
                id: generateId(),
                name: name,
                bloodGroup: bloodGroup,
                units: units,
                city: city,
                phone: phone,
                date: date
            });
            saveRequests(requests);
            logActivity('New blood request posted for ' + bloodGroup + ' in ' + city);
            form.reset();
            showToast('Blood request submitted.', 'success');
            renderRequests();
        });

        renderRequests();
    }

    function initLoginPage() {
        const form = document.getElementById('login-form');
        const passwordInput = document.getElementById('password');
        const passwordToggle = document.getElementById('toggle-password');

        if (passwordInput && passwordToggle) {
            passwordToggle.addEventListener('click', function() {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                const icon = passwordToggle.querySelector('i');
                if (icon) {
                    if (isPassword) {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        }

        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const now = Date.now();
            const security = getLocal('adminSecurity', { failed: 0, lockUntil: 0 });
            if (security.lockUntil && now < security.lockUntil) {
                const remainingMs = security.lockUntil - now;
                const remainingMin = Math.ceil(remainingMs / 60000);
                showToast('Too many attempts. Try again in ' + remainingMin + ' minute(s).', 'error');
                return;
            }
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                security.failed = 0;
                security.lockUntil = 0;
                setLocal('adminSecurity', security);
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminUser', username);
                logActivity('Admin logged in: ' + username);
                showToast('Login successful!', 'success');
                setTimeout(function() {
                    window.location.href = 'admin.html';
                }, 800);
            } else {
                security.failed = (security.failed || 0) + 1;
                if (security.failed >= 5) {
                    security.lockUntil = now + 5 * 60 * 1000;
                    showToast('Too many attempts. Admin locked for 5 minutes.', 'error');
                } else {
                    showToast('Invalid admin username or password.', 'error');
                }
                setLocal('adminSecurity', security);
            }
        });
    }

    function enforceAdminAuth() {
        var path = window.location.pathname;
        if (path.indexOf('admin.html') !== -1) {
            if (!sessionStorage.getItem('isAdmin')) {
                window.location.href = 'login.html';
            }
        }
    }

    function initAdminDashboard() {
        const totalDonorsEl = document.getElementById('total-donors');
        const totalRequestsEl = document.getElementById('total-requests');
        const mostNeededEl = document.getElementById('most-needed');
        const donorsTableBody = document.querySelector('#donors-table tbody');
        const noDonorsMsg = document.getElementById('no-donors-msg');
        const requestsTableBody = document.querySelector('#requests-table tbody');
        const noRequestsMsg = document.getElementById('no-requests-msg');
        const adminsTableBody = document.querySelector('#admins-table tbody');
        const noAdminsMsg = document.getElementById('no-admins-msg');
        const activityList = document.getElementById('activity-log');

        if (!totalDonorsEl || !totalRequestsEl || !mostNeededEl) return;

        function refreshStats() {
            const donors = getDonors();
            const requests = getRequests();
            totalDonorsEl.innerText = donors.length;
            totalRequestsEl.innerText = requests.length;
            if (requests.length === 0) {
                mostNeededEl.innerText = '-';
                return;
            }
            const counts = {};
            requests.forEach(function(req) {
                counts[req.bloodGroup] = (counts[req.bloodGroup] || 0) + 1;
            });
            let topGroup = null;
            Object.keys(counts).forEach(function(bg) {
                if (!topGroup || counts[bg] > counts[topGroup]) {
                    topGroup = bg;
                }
            });
            mostNeededEl.innerText = topGroup || '-';
        }

        function renderDonorsTable() {
            const donors = getDonors();
            donorsTableBody.innerHTML = '';
            if (donors.length === 0) {
                if (noDonorsMsg) noDonorsMsg.style.display = 'block';
                return;
            }
            if (noDonorsMsg) noDonorsMsg.style.display = 'none';
            donors.forEach(function(donor) {
                const row = document.createElement('tr');
                row.innerHTML =
                    '<td>' + escapeHtml(donor.name) + '</td>' +
                    '<td>' + escapeHtml(donor.age) + '</td>' +
                    '<td>' + escapeHtml(donor.gender) + '</td>' +
                    '<td>' + escapeHtml(donor.bloodGroup) + '</td>' +
                    '<td>' + escapeHtml(donor.city) + '</td>' +
                    '<td>' + escapeHtml(donor.phone) + '</td>' +
                    '<td>' +
                    '<button class="action-btn edit-btn" onclick="editDonor(\'' + donor.id + '\')"><i class="fas fa-edit"></i></button>' +
                    '<button class="action-btn delete-btn" onclick="deleteDonorHandler(\'' + donor.id + '\')"><i class="fas fa-trash"></i></button>' +
                    '</td>';
                donorsTableBody.appendChild(row);
            });
        }

        function renderRequestsTable() {
            const requests = getRequests();
            requestsTableBody.innerHTML = '';
            if (requests.length === 0) {
                if (noRequestsMsg) noRequestsMsg.style.display = 'block';
                return;
            }
            if (noRequestsMsg) noRequestsMsg.style.display = 'none';
            requests.forEach(function(req) {
                const row = document.createElement('tr');
                row.innerHTML =
                    '<td>' + escapeHtml(req.name) + '</td>' +
                    '<td>' + escapeHtml(req.bloodGroup) + '</td>' +
                    '<td>' + escapeHtml(req.units) + '</td>' +
                    '<td>' + escapeHtml(req.city) + '</td>' +
                    '<td>' + escapeHtml(req.phone) + '</td>' +
                    '<td>' + escapeHtml(req.date) + '</td>' +
                    '<td>' +
                    '<button class="action-btn edit-btn" onclick="editRequestHandler(\'' + req.id + '\')"><i class="fas fa-edit"></i></button>' +
                    '<button class="action-btn delete-btn" onclick="deleteRequestHandler(\'' + req.id + '\')"><i class="fas fa-trash"></i></button>' +
                    '</td>';
                requestsTableBody.appendChild(row);
            });
        }

        function renderAdminsTable() {
            if (!adminsTableBody) return;
            adminsTableBody.innerHTML = '';
            if (noAdminsMsg) noAdminsMsg.style.display = 'none';
            const row = document.createElement('tr');
            row.innerHTML =
                '<td>' + ADMIN_USERNAME + '</td>' +
                '<td>1</td>' +
                '<td><span style="color:#999;">Fixed admin</span></td>';
            adminsTableBody.appendChild(row);
        }

        function renderActivity() {
            if (!activityList) return;
            const entries = getActivityLog();
            activityList.innerHTML = '';
            if (entries.length === 0) {
                const li = document.createElement('li');
                li.style.opacity = '0.7';
                li.style.fontStyle = 'italic';
                li.innerText = 'No activity yet.';
                activityList.appendChild(li);
                return;
            }
            entries.forEach(function(item) {
                const li = document.createElement('li');
                li.innerHTML = '<strong>' + escapeHtml(item.time) + ':</strong> ' + escapeHtml(item.message);
                activityList.appendChild(li);
            });
        }

        function renderCharts() {
            const donors = getDonors();
            const requests = getRequests();
            const bgCanvas = document.getElementById('bloodGroupChart');
            const reqCanvas = document.getElementById('requestsChart');
            if (typeof Chart === 'undefined') return;
            if (bgCanvas) {
                const counts = {
                    'A+': 0, 'A-': 0,
                    'B+': 0, 'B-': 0,
                    'AB+': 0, 'AB-': 0,
                    'O+': 0, 'O-': 0
                };
                donors.forEach(function(d) {
                    if (counts.hasOwnProperty(d.bloodGroup)) {
                        counts[d.bloodGroup] += 1;
                    }
                });
                const labels = Object.keys(counts);
                const data = Object.values(counts);
                new Chart(bgCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                '#9966FF', '#FF9F40', '#E7E9ED', '#FF6384'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
            if (reqCanvas) {
                const counts = {};
                requests.forEach(function(r) {
                    counts[r.bloodGroup] = (counts[r.bloodGroup] || 0) + 1;
                });
                const labels = Object.keys(counts);
                const data = Object.values(counts);
                new Chart(reqCanvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Requests',
                            data: data,
                            backgroundColor: '#e63946'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }

        window.logout = function() {
            sessionStorage.removeItem('isAdmin');
            sessionStorage.removeItem('adminUser');
            showToast('Logged out.', 'success');
            setTimeout(function() {
                window.location.href = 'login.html';
            }, 600);
        };

        window.editDonor = function(id) {
            const donors = getDonors();
            const donor = donors.find(function(d) { return d.id === id; });
            if (!donor) return;
            const name = prompt('Edit Name:', donor.name);
            if (name === null) return;
            const city = prompt('Edit City:', donor.city);
            if (city === null) return;
            donor.name = name.trim() || donor.name;
            donor.city = city.trim() || donor.city;
            saveDonors(donors);
            logActivity('Donor updated: ' + donor.name);
            renderDonorsTable();
            refreshStats();
            renderCharts();
        };

        window.deleteDonorHandler = function(id) {
            if (!confirm('Are you sure you want to delete this donor?')) return;
            let donors = getDonors();
            const donor = donors.find(function(d) { return d.id === id; });
            donors = donors.filter(function(d) { return d.id !== id; });
            saveDonors(donors);
            if (donor) logActivity('Donor deleted: ' + donor.name);
            showToast('Donor deleted successfully.', 'success');
            renderDonorsTable();
            refreshStats();
            renderCharts();
        };

        window.editRequestHandler = function(id) {
            const requests = getRequests();
            const req = requests.find(function(r) { return r.id === id; });
            if (!req) return;
            const units = prompt('Edit Units Needed:', req.units);
            if (units === null) return;
            const date = prompt('Edit Date Needed:', req.date);
            if (date === null) return;
            const phone = prompt('Edit Contact Phone:', req.phone);
            if (phone === null) return;
            req.units = parseInt(units, 10) || req.units;
            req.date = date || req.date;
            req.phone = phone || req.phone;
            saveRequests(requests);
            logActivity('Blood request updated for ' + req.bloodGroup);
            renderRequestsTable();
            refreshStats();
            renderCharts();
        };

        window.deleteRequestHandler = function(id) {
            if (!confirm('Are you sure you want to delete this request?')) return;
            let requests = getRequests();
            const req = requests.find(function(r) { return r.id === id; });
            requests = requests.filter(function(r) { return r.id !== id; });
            saveRequests(requests);
            if (req) logActivity('Blood request deleted for ' + req.bloodGroup);
            showToast('Request deleted successfully.', 'success');
            renderRequestsTable();
            refreshStats();
            renderCharts();
        };

        window.exportDonorsToCSV = function() {
            const donors = getDonors();
            if (!donors || donors.length === 0) {
                showToast('No donors to export.', 'error');
                return;
            }
            const headers = ['Name', 'Age', 'Gender', 'Blood Group', 'City', 'Phone', 'Last Donation'];
            const rows = donors.map(function(d) {
                return [
                    '"' + d.name + '"',
                    d.age,
                    d.gender,
                    d.bloodGroup,
                    '"' + d.city + '"',
                    '"' + d.phone + '"',
                    '"' + (d.lastDonation || '') + '"'
                ].join(',');
            });
            const csv = [headers.join(',')].concat(rows).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'donors.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Donors exported to CSV.', 'success');
        };

        window.exportDonorsToPDF = function() {
            showToast('PDF export is not available in this build.', 'error');
        };

        refreshStats();
        renderDonorsTable();
        renderRequestsTable();
        renderAdminsTable();
        renderActivity();
        renderCharts();
    }

    function initMapLogic() {
        function makeMap() {
            const mapElement = document.getElementById('map');
            if (!mapElement) return;
            if (typeof L === 'undefined') {
                console.error('Leaflet not loaded');
                return;
            }
            const map = L.map('map').setView([20.5937, 78.9629], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const donors = getDonors();
            const cityCoords = {
                'Mumbai': [19.0760, 72.8777],
                'Delhi': [28.7041, 77.1025],
                'Bangalore': [12.9716, 77.5946],
                'Hyderabad': [17.3850, 78.4867],
                'Ahmedabad': [23.0225, 72.5714],
                'Chennai': [13.0827, 80.2707],
                'Kolkata': [22.5726, 88.3639],
                'Surat': [21.1702, 72.8311],
                'Pune': [18.5204, 73.8567],
                'Jaipur': [26.9124, 75.7873],
                'Lucknow': [26.8467, 80.9462],
                'Kanpur': [26.4499, 80.3319],
                'Nagpur': [21.1458, 79.0882],
                'Indore': [22.7196, 75.8577],
                'Thane': [19.2183, 72.9781],
                'Bhopal': [23.2599, 77.4126],
                'Visakhapatnam': [17.6868, 83.2185],
                'Patna': [25.5941, 85.1376],
                'Vadodara': [22.3072, 73.1812],
                'Varanasi': [25.3176, 82.9739]
            };

            const markersLayer = L.layerGroup().addTo(map);

            function renderMarkers(filterCityKey) {
                markersLayer.clearLayers();
                const bounds = L.latLngBounds();
                donors.forEach(function(donor) {
                    const rawCity = donor.city;
                    if (!rawCity) return;
                    const city = rawCity.trim();
                    if (!city) return;
                    let cityKey = Object.keys(cityCoords).find(function(key) {
                        return key.toLowerCase() === city.toLowerCase();
                    });
                    let lat;
                    let lng;
                    if (cityKey) {
                        if (filterCityKey && cityKey !== filterCityKey) return;
                        lat = cityCoords[cityKey][0];
                        lng = cityCoords[cityKey][1];
                    } else {
                        cityKey = city;
                        if (filterCityKey && cityKey !== filterCityKey) return;
                        lat = 20.5937;
                        lng = 78.9629;
                    }
                    const jitterLat = lat + (Math.random() - 0.5) * 0.05;
                    const jitterLng = lng + (Math.random() - 0.5) * 0.05;
                    const marker = L.marker([jitterLat, jitterLng]).addTo(markersLayer);
                    const waLink = 'https://wa.me/' + encodeURIComponent(donor.phone) + '?text=Hello ' + encodeURIComponent(donor.name) + ', found you on BloodLink Map.';
                    const popup =
                        '<div style="text-align:center;">' +
                        '<b>' + escapeHtml(donor.name) + '</b><br>' +
                        '<span style="color:var(--primary-color); font-weight:bold;">' + escapeHtml(donor.bloodGroup) + '</span><br>' +
                        escapeHtml(city) + '<br>' +
                        '<div style="margin-top:5px;">' +
                        '<a href="tel:' + donor.phone + '" class="btn btn-primary" style="padding:2px 5px; font-size:0.8rem;">Call</a> ' +
                        '<a href="' + waLink + '" target="_blank" class="btn btn-secondary" style="padding:2px 5px; font-size:0.8rem; background:#25D366; color:white; border:none;">WA</a>' +
                        '</div>' +
                        '</div>';
                    marker.bindPopup(popup);
                    bounds.extend([jitterLat, jitterLng]);
                });
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [40, 40] });
                } else {
                    map.setView([20.5937, 78.9629], 5);
                }
            }

            const citySelect = document.getElementById('map-city-select');
            if (citySelect) {
                const citySet = new Set();
                donors.forEach(function(donor) {
                    const rawCity = donor.city;
                    if (!rawCity) return;
                    const city = rawCity.trim();
                    if (!city) return;
                    let cityKey = Object.keys(cityCoords).find(function(key) {
                        return key.toLowerCase() === city.toLowerCase();
                    });
                    if (!cityKey) cityKey = city;
                    citySet.add(cityKey);
                });
                Array.from(citySet).sort().forEach(function(cityName) {
                    const opt = document.createElement('option');
                    opt.value = cityName;
                    opt.textContent = cityName;
                    citySelect.appendChild(opt);
                });
                citySelect.addEventListener('change', function() {
                    const selected = citySelect.value;
                    if (!selected) {
                        renderMarkers(null);
                    } else {
                        renderMarkers(selected);
                    }
                });
            }

            renderMarkers(null);
        }

        window.initMap = makeMap;
    }

    function initContactPage() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            form.reset();
            showToast('Message sent. We will contact you soon.', 'success');
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        setupThemeToggle();
        setupHamburger();
        initRegistrationPage();
        initSearchPage();
        initRequestPage();
        initLoginPage();
        enforceAdminAuth();
        initAdminDashboard();
        initMapLogic();
        initContactPage();
    });
})();
