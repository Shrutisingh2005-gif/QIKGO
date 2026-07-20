// QIKGO Safar Prototype Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // State Management
    let state = {
        theme: 'dark',
        activeTab: 'passenger',
        booking: {
            from: 'Pune Hub',
            to: 'Satara Hub',
            seats: 1,
            routeType: 'hub', // 'hub' or 'door'
            cargoEnabled: false,
            cargoType: 'box-small',
            recipient: ''
        },
        driverStats: {
            earnings: 1450,
            seatsBooked: 3,
            cargoItems: 2
        },
        manifest: [
            { id: 1, type: 'passenger', name: 'Ramesh Kumar', route: 'Pune ➔ Satara', status: 'Confirmed', payout: 250 },
            { id: 2, type: 'cargo', name: 'Agro-Seeds Box', route: 'Pune ➔ Shirwal', status: 'Loaded', payout: 180 },
            { id: 3, type: 'passenger', name: 'Savita Patil', route: 'Shirwal ➔ Wai Phata', status: 'Confirmed', payout: 120 }
        ],
        smsHistory: [
            { type: 'incoming', text: 'Welcome to QIKGO Safar offline help desk. You are currently offline (no internet detected).\n\nUse commands to book:\nBOOK [from] [to]\n\nOr ask for cargo details:\nBOOK [from] [to] CARGO [type]', time: '10:48 AM' }
        ]
    };

    // Coordinate Map for Animation
    const hubCoordinates = {
        'Pune Hub': { x: 200, y: 60 },
        'Shirwal Junction': { x: 145, y: 195 },
        'Wai Phata': { x: 210, y: 325 },
        'Satara Hub': { x: 280, y: 440 }
    };

    // DOM Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const cards = document.querySelectorAll('.card');

    // Passenger Form Inputs
    const pickupHubSelect = document.getElementById('pickup-hub');
    const dropHubSelect = document.getElementById('drop-hub');
    const seatsSelect = document.getElementById('seats-count');
    const routeTypeOptions = document.querySelectorAll('.route-type-option');
    const cargoToggleBtn = document.getElementById('cargo-toggle-btn');
    const cargoCheckbox = document.getElementById('cargo-enabled');
    const cargoDetailsPanel = document.getElementById('cargo-details-panel');
    const cargoTypeSelect = document.getElementById('cargo-type');
    const cargoRecipientInput = document.getElementById('cargo-recipient');
    
    // Pricing Elements
    const priceSeatsSummary = document.getElementById('summary-seats');
    const priceBaseEl = document.getElementById('price-base');
    const priceDetourRow = document.getElementById('price-row-detour');
    const priceDetourEl = document.getElementById('price-detour');
    const priceCargoRow = document.getElementById('price-row-cargo-credit');
    const priceCargoEl = document.getElementById('price-cargo-credit');
    const priceTotalEl = document.getElementById('price-total');
    const confirmBookingBtn = document.getElementById('confirm-booking-btn');

    // Driver Portal Elements
    const driverEarningsEl = document.getElementById('driver-earnings');
    const driverSeatsEl = document.getElementById('driver-manifest-seats');
    const driverCargoEl = document.getElementById('driver-manifest-cargo');
    const manifestContainer = document.getElementById('manifest-items-container');
    const simulateBackhaulBtn = document.getElementById('simulate-backhaul-btn');

    // SMS Elements
    const smsContainer = document.getElementById('sms-messages-container');
    const cmdBookSms = document.getElementById('cmd-book-sms');
    const cmdCargoSms = document.getElementById('cmd-cargo-sms');
    const cmdStatusSms = document.getElementById('cmd-status-sms');
    const cmdHelpSms = document.getElementById('cmd-help-sms');

    // Strategy Modal Elements
    const openStrategyModalBtn = document.getElementById('open-strategy-modal');
    const closeStrategyModalBtn = document.getElementById('close-strategy-modal');
    const strategyModal = document.getElementById('strategy-modal');

    // Map Elements
    const mapCarMarker = document.getElementById('map-car');
    const mapHubPune = document.getElementById('map-hub-pune');
    const mapHubShirwal = document.getElementById('map-hub-shirwal');
    const mapHubWai = document.getElementById('map-hub-wai');
    const mapHubSatara = document.getElementById('map-hub-satara');

    // --- Core Themes & Tabs ---
    
    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', state.theme);
        if (state.theme === 'light') {
            themeIcon.setAttribute('data-lucide', 'moon');
            themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
        } else {
            themeIcon.setAttribute('data-lucide', 'sun');
            themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
        }
        lucide.createIcons();
    });

    // Tab Switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            state.activeTab = targetTab;
            
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.getAttribute('id') === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });

            // Set active glow border on the open cards
            cards.forEach(c => {
                c.classList.remove('active-card');
                if (c.querySelector(`.${targetTab}-dashboard`) || c.getAttribute('id') === `${targetTab}-tab` || c.classList.contains('map-card') || c.classList.contains('phone-simulator-card')) {
                    c.classList.add('active-card');
                }
            });
        });
    });

    // --- Strategy Modal Logic ---
    openStrategyModalBtn.addEventListener('click', () => {
        strategyModal.style.display = 'flex';
    });

    closeStrategyModalBtn.addEventListener('click', () => {
        strategyModal.style.display = 'none';
    });

    strategyModal.addEventListener('click', (e) => {
        if (e.target === strategyModal) {
            strategyModal.style.display = 'none';
        }
    });

    // --- Dynamic Pricing Calculations ---
    
    const calculateFare = () => {
        const from = pickupHubSelect.value;
        const to = dropHubSelect.value;
        
        // Prevent booking to same location
        if (from === to) {
            priceTotalEl.innerText = "Select distinct hubs";
            priceTotalEl.style.color = "var(--accent-rose)";
            confirmBookingBtn.disabled = true;
            return;
        } else {
            priceTotalEl.style.color = "var(--accent-emerald)";
            confirmBookingBtn.disabled = false;
        }

        const seats = parseInt(seatsSelect.value);
        const routeType = state.booking.routeType;
        const cargoEnabled = cargoCheckbox.checked;

        // Base rate calculation based on hops
        const hubsList = ['Pune Hub', 'Shirwal Junction', 'Wai Phata', 'Satara Hub'];
        const fromIndex = hubsList.indexOf(from);
        const toIndex = hubsList.indexOf(to);
        const hops = Math.abs(fromIndex - toIndex);

        let basePricePerSeat = 0;
        if (hops === 1) basePricePerSeat = 120;
        else if (hops === 2) basePricePerSeat = 190;
        else if (hops === 3) basePricePerSeat = 250;

        const baseTotal = basePricePerSeat * seats;
        priceSeatsSummary.innerText = seats;
        priceBaseEl.innerText = `₹${baseTotal.toFixed(2)}`;

        // Detour pricing (Door-to-door)
        let detourCharge = 0;
        if (routeType === 'door') {
            detourCharge = 120;
            priceDetourRow.style.display = 'flex';
            priceDetourEl.innerText = `₹${detourCharge.toFixed(2)}`;
        } else {
            priceDetourRow.style.display = 'none';
        }

        // Cargo Credit Payout (Subsidizes passenger fare)
        let cargoCredit = 0;
        if (cargoEnabled) {
            const cargoType = cargoTypeSelect.value;
            if (cargoType === 'documents') cargoCredit = 40;
            else if (cargoType === 'box-small') cargoCredit = 80;
            else if (cargoType === 'box-medium') cargoCredit = 120;
            else if (cargoType === 'produce') cargoCredit = 60;

            priceCargoRow.style.display = 'flex';
            priceCargoEl.innerText = `-₹${cargoCredit.toFixed(2)}`;
        } else {
            priceCargoRow.style.display = 'none';
        }

        // Final Payout calculation
        const total = Math.max(50, (baseTotal + detourCharge) - cargoCredit);
        priceTotalEl.innerText = `₹${total.toFixed(2)}`;

        // Save current booking values
        state.booking.from = from;
        state.booking.to = to;
        state.booking.seats = seats;
        state.booking.cargoEnabled = cargoEnabled;
    };

    // Form Event Listeners
    pickupHubSelect.addEventListener('change', calculateFare);
    dropHubSelect.addEventListener('change', calculateFare);
    seatsSelect.addEventListener('change', calculateFare);
    cargoTypeSelect.addEventListener('change', calculateFare);

    routeTypeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            routeTypeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            state.booking.routeType = opt.getAttribute('data-type');
            calculateFare();
        });
    });

    // Cargo toggle trigger
    cargoToggleBtn.addEventListener('click', (e) => {
        // Prevent toggle if clicking within selection boxes
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
        
        if (e.target !== cargoCheckbox) {
            cargoCheckbox.checked = !cargoCheckbox.checked;
        }

        if (cargoCheckbox.checked) {
            cargoDetailsPanel.style.display = 'block';
        } else {
            cargoDetailsPanel.style.display = 'none';
        }
        calculateFare();
    });

    // --- SVG Map Animation Logic ---
    
    const animateCarRoute = (fromHub, toHub, duration = 3000) => {
        const fromCoord = hubCoordinates[fromHub];
        const toCoord = hubCoordinates[toHub];
        
        if (!fromCoord || !toCoord) return;

        // Reset and show car marker
        mapCarMarker.style.opacity = '1';
        mapCarMarker.setAttribute('transform', `translate(${fromCoord.x}, ${fromCoord.y})`);

        // Find route nodes to interpolate smoothly along the path
        const hubsList = ['Pune Hub', 'Shirwal Junction', 'Wai Phata', 'Satara Hub'];
        const startIndex = hubsList.indexOf(fromHub);
        const endIndex = hubsList.indexOf(toHub);
        
        let pathNodes = [];
        if (startIndex <= endIndex) {
            for (let i = startIndex; i <= endIndex; i++) {
                pathNodes.push(hubCoordinates[hubsList[i]]);
            }
        } else {
            for (let i = startIndex; i >= endIndex; i--) {
                pathNodes.push(hubCoordinates[hubsList[i]]);
            }
        }

        let startTime = null;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Interpolate position along sequential segments
            const segmentCount = pathNodes.length - 1;
            const segmentIndex = Math.min(Math.floor(progress * segmentCount), segmentCount - 1);
            
            const segmentProgress = (progress * segmentCount) - segmentIndex;
            
            const currentStart = pathNodes[segmentIndex];
            const currentEnd = pathNodes[segmentIndex + 1];

            const currentX = currentStart.x + (currentEnd.x - currentStart.x) * segmentProgress;
            const currentY = currentStart.y + (currentEnd.y - currentStart.y) * segmentProgress;

            // Calculate rotation angle
            const angleRad = Math.atan2(currentEnd.y - currentStart.y, currentEnd.x - currentStart.x);
            const angleDeg = angleRad * (180 / Math.PI) + 90; // offset for SVG arrow orientation

            mapCarMarker.setAttribute('transform', `translate(${currentX}, ${currentY}) rotate(${angleDeg})`);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Done animating, pulse the destination hub as confirmation
                const destPulse = document.querySelector(`#map-hub-${toHub.split(' ')[0].toLowerCase()}`);
                if (destPulse) {
                    destPulse.querySelector('.map-hub-dot').style.r = '14';
                    setTimeout(() => {
                        destPulse.querySelector('.map-hub-dot').style.r = '7';
                    }, 500);
                }
            }
        };

        requestAnimationFrame(animate);
    };

    // --- Bookings & Manifest Updates ---

    const renderManifest = () => {
        manifestContainer.innerHTML = '';
        
        if (state.manifest.length === 0) {
            manifestContainer.innerHTML = `
                <div class="manifest-item empty-state">
                    No active manifests scheduled for today.
                </div>
            `;
            return;
        }

        state.manifest.forEach(item => {
            const el = document.createElement('div');
            el.className = 'manifest-item';
            
            const badgeClass = item.type === 'passenger' ? 'passenger' : 'cargo';
            const icon = item.type === 'passenger' ? 'user' : 'package';
            const routeName = item.route;

            el.innerHTML = `
                <div class="manifest-details">
                    <h5>${item.name}</h5>
                    <p class="manifest-route">${routeName}</p>
                </div>
                <div class="manifest-status">
                    <span class="status-badge ${badgeClass}">${item.type}</span>
                    <span style="font-weight:700; font-size:0.85rem; color:var(--accent-cyan);">₹${item.payout}</span>
                </div>
            `;
            manifestContainer.appendChild(el);
        });

        // Update Driver stats count
        driverEarningsEl.innerText = `₹${state.driverStats.earnings}`;
        driverSeatsEl.innerText = `${state.driverStats.seatsBooked} / 4`;
        driverCargoEl.innerText = `${state.driverStats.cargoItems} ${state.driverStats.cargoItems === 1 ? 'Item' : 'Items'}`;
    };

    // Confirm passenger booking action
    confirmBookingBtn.addEventListener('click', () => {
        const from = pickupHubSelect.value;
        const to = dropHubSelect.value;
        const seats = parseInt(seatsSelect.value);
        const isCargo = cargoCheckbox.checked;
        const fareString = priceTotalEl.innerText.replace('₹', '');
        const fare = parseFloat(fareString);

        // Add to manifest state
        const passName = "Passenger Pool (" + seats + " Seat" + (seats > 1 ? 's' : '') + ")";
        const routeLabel = `${from.split(' ')[0]} ➔ ${to.split(' ')[0]}`;
        
        state.manifest.push({
            id: Date.now(),
            type: 'passenger',
            name: passName,
            route: routeLabel,
            status: 'Confirmed',
            payout: fare
        });

        state.driverStats.seatsBooked += seats;
        state.driverStats.earnings += fare;

        if (isCargo) {
            const cargoType = cargoTypeSelect.value;
            const cargoLabel = cargoType.charAt(0).toUpperCase() + cargoType.slice(1).replace('-', ' ');
            state.manifest.push({
                id: Date.now() + 1,
                type: 'cargo',
                name: `${cargoLabel} Package`,
                route: routeLabel,
                status: 'Loaded',
                payout: 80 // Flat cargo payout base
            });
            state.driverStats.cargoItems += 1;
            state.driverStats.earnings += 80;
        }

        // Render update
        renderManifest();

        // Trigger map animation
        animateCarRoute(from, to);

        // Success notification banner (temporary)
        confirmBookingBtn.innerHTML = `<i data-lucide="check"></i> Booking Confirmed!`;
        confirmBookingBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        setTimeout(() => {
            confirmBookingBtn.innerHTML = `<i data-lucide="check-circle"></i> Confirm Scheduled Booking`;
            confirmBookingBtn.style.background = 'var(--grad-primary)';
            lucide.createIcons();
            
            // Switch tab to Driver manifest so the user sees it in action
            const driverTab = document.querySelector('.nav-tab[data-tab="driver"]');
            if (driverTab) driverTab.click();
        }, 1500);

        lucide.createIcons();
    });

    // Simulate Backhaul return trip matches (Differentiator simulation)
    simulateBackhaulBtn.addEventListener('click', () => {
        simulateBackhaulBtn.disabled = true;
        simulateBackhaulBtn.innerHTML = `<i data-lucide="refresh-cw" class="spinning" style="animation: spin 1s infinite linear;"></i> Searching Highway Returns...`;
        lucide.createIcons();

        setTimeout(() => {
            // Push return routes from Satara to Pune
            state.manifest.push({
                id: Date.now() + 2,
                type: 'passenger',
                name: 'Amit Deshmukh (Return carpool)',
                route: 'Satara ➔ Pune',
                status: 'Matched',
                payout: 250
            });
            state.manifest.push({
                id: Date.now() + 3,
                type: 'cargo',
                name: 'Diagnostic Medical Supplies',
                route: 'Wai Phata ➔ Pune',
                status: 'Matched',
                payout: 150
            });

            state.driverStats.seatsBooked = Math.min(4, state.driverStats.seatsBooked + 1);
            state.driverStats.cargoItems += 1;
            state.driverStats.earnings += 400;

            renderManifest();

            simulateBackhaulBtn.innerHTML = `<i data-lucide="check"></i> Return Matches Found!`;
            simulateBackhaulBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
            
            // Animate map car returning back
            animateCarRoute('Satara Hub', 'Pune Hub', 4000);

            setTimeout(() => {
                simulateBackhaulBtn.disabled = false;
                simulateBackhaulBtn.innerHTML = `<i data-lucide="shuffle"></i> Find Return Route Matches`;
                simulateBackhaulBtn.style.background = 'linear-gradient(135deg, var(--accent-emerald), #059669)';
                lucide.createIcons();
            }, 1800);

        }, 1200);
    });

    // --- Offline SMS Simulator ---

    const sendSms = (text) => {
        // Append user outgoing message
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const outBubble = document.createElement('div');
        outBubble.className = 'sms-bubble outgoing';
        outBubble.innerHTML = `
            ${text}
            <span class="sms-time">${timeStr}</span>
        `;
        smsContainer.appendChild(outBubble);
        smsContainer.scrollTop = smsContainer.scrollHeight;

        // Simulate network processing with delay
        setTimeout(() => {
            const inBubble = document.createElement('div');
            inBubble.className = 'sms-bubble incoming';
            
            let replyText = '';
            
            if (text.includes('BOOK PUNE SATARA')) {
                replyText = `<strong>QIKGO Booking Success!</strong>\n\nTrip: Pune Swargate ➔ Satara Hub\nDriver: Santosh D. (White Dzire)\nDeparting: Today, 02:00 PM\nOTP: 4892\nFare: ₹250.00\n\nShow OTP to driver at Swargate highway junction.`;
                
                // Add to manifest behind the scenes
                state.manifest.push({
                    id: Date.now() + 10,
                    type: 'passenger',
                    name: 'SMS Pooler (1 seat)',
                    route: 'Pune ➔ Satara',
                    status: 'Confirmed',
                    payout: 250
                });
                state.driverStats.seatsBooked = Math.min(4, state.driverStats.seatsBooked + 1);
                state.driverStats.earnings += 250;
                renderManifest();
                animateCarRoute('Pune Hub', 'Satara Hub');
            } 
            else if (text.includes('CARGO BOX')) {
                replyText = `<strong>QIKGO Cargo Received!</strong>\n\nPickup: Shirwal Junction\nDestination: Pune Swargate\nAssigned Courier: Santosh D.\nPackage Code: BOX-88A\nEstimated dropoff: 3:30 PM\n\nCourier will collect at Shirwal Highway Tea Corner.`;
                
                // Add to manifest
                state.manifest.push({
                    id: Date.now() + 11,
                    type: 'cargo',
                    name: 'SMS Parcel (Box)',
                    route: 'Shirwal ➔ Pune',
                    status: 'Confirmed',
                    payout: 120
                });
                state.driverStats.cargoItems += 1;
                state.driverStats.earnings += 120;
                renderManifest();
                animateCarRoute('Shirwal Junction', 'Pune Hub');
            } 
            else if (text === 'STATUS') {
                const count = state.manifest.length;
                replyText = `<strong>QIKGO System Status</strong>\n\nActive Trips: 1 (Pune-Satara corridor)\nMatched passengers: ${state.driverStats.seatsBooked}/4\nLogistics Cargo Load: ${state.driverStats.cargoItems} units\nNetwork Mode: Cell-Tower SMS Fallback active.`;
            } 
            else {
                replyText = `<strong>QIKGO Safar Help</strong>\n\nSend codes:\n1. <code>BOOK [from] [to]</code> (e.g. BOOK PUNE SATARA)\n2. <code>BOOK [from] [to] CARGO BOX</code>\n3. Send <code>STATUS</code> to verify.`;
            }

            inBubble.innerHTML = `
                ${replyText.replace(/\n/g, '<br>')}
                <span class="sms-time">${timeStr}</span>
            `;
            smsContainer.appendChild(inBubble);
            smsContainer.scrollTop = smsContainer.scrollHeight;
            lucide.createIcons();
        }, 1000);
    };

    // SMS button triggers
    cmdBookSms.addEventListener('click', () => sendSms('BOOK PUNE SATARA'));
    cmdCargoSms.addEventListener('click', () => sendSms('BOOK SHIRWAL PUNE CARGO BOX'));
    cmdStatusSms.addEventListener('click', () => sendSms('STATUS'));
    cmdHelpSms.addEventListener('click', () => sendSms('HELP'));

    // --- Initial setup runs ---
    calculateFare();
    renderManifest();
});
