/* ============================================
   TRITON CARPOOL — script.js
   JavaScript for UCSD Carpool Web App

   Features ported from original Carpool Buddy
   mobile app (IB CS 2022):
   - Vehicle types: Car, Electric, Bicycle, Segway, Helicopter
   - Type-specific properties (range, weight, altitude, etc.)
   - User roles: Student, Teacher, Parent, Alumni
   - Price multiplier: Students/Teachers pay 50%, Parents/Alumni pay 100%
   - Open/Close vehicle toggle (only owners can control)
   - Vehicle model names
   ============================================ */

/* ============================================
   DATA STORAGE (localStorage)
   ============================================ */

const sampleRides = [
    {
        id: 1, driver: "King Triton", model: "Tesla Model S",
        vehicleType: "electric", departure: "Geisel Library",
        destination: "Old Town San Diego", date: "2026-04-05",
        time: "15:00", seats: 4, seatsBooked: 1, price: 10.00,
        open: true, specs: { range: 370 }
    },
    {
        id: 2, driver: "Peter the Triton", model: "Giant Escape 2",
        vehicleType: "bicycle", departure: "Price Center",
        destination: "La Jolla Shores", date: "2026-04-06",
        time: "12:30", seats: 1, seatsBooked: 0, price: 3.00,
        open: true, specs: { bicycleType: "Road", weight: 22 }
    },
    {
        id: 3, driver: "Sally Seahorse", model: "Toyota RAV4",
        vehicleType: "car", departure: "Sixth College",
        destination: "Mission Beach", date: "2026-04-07",
        time: "10:00", seats: 4, seatsBooked: 2, price: 8.00,
        open: true, specs: { range: 400 }
    },
    {
        id: 4, driver: "Triton Tina", model: "Honda Odyssey",
        vehicleType: "car", departure: "Warren College",
        destination: "San Diego Airport (SAN)", date: "2026-04-08",
        time: "06:00", seats: 6, seatsBooked: 0, price: 15.00,
        open: true, specs: { range: 350 }
    },
    {
        id: 5, driver: "Captain Triton", model: "Ninebot S",
        vehicleType: "segway", departure: "RIMAC Arena",
        destination: "UTC Mall", date: "2026-04-09",
        time: "14:00", seats: 1, seatsBooked: 0, price: 5.00,
        open: true, specs: { range: 13, weightCapacity: 220 }
    },
    {
        id: 6, driver: "Dean McFly", model: "Agusta Westland 109",
        vehicleType: "helicopter", departure: "Torrey Pines Gliderport",
        destination: "Downtown SD Helipad", date: "2026-04-10",
        time: "08:00", seats: 6, seatsBooked: 0, price: 50.00,
        open: false, specs: { maxAltitude: 15000, maxAirSpeed: 177 }
    }
];

function getRides() {
    const stored = localStorage.getItem("tritonCarpool_rides");
    if (stored) return JSON.parse(stored);
    localStorage.setItem("tritonCarpool_rides", JSON.stringify(sampleRides));
    return sampleRides;
}
function saveRides(rides) { localStorage.setItem("tritonCarpool_rides", JSON.stringify(rides)); }
function getNextId() {
    const rides = getRides();
    return rides.length === 0 ? 1 : Math.max(...rides.map(r => r.id)) + 1;
}

// My Rides tracking
function getMyBookedIds() { return JSON.parse(localStorage.getItem("tritonCarpool_myBooked") || "[]"); }
function saveMyBookedIds(ids) { localStorage.setItem("tritonCarpool_myBooked", JSON.stringify(ids)); }
function getMyOfferedIds() { return JSON.parse(localStorage.getItem("tritonCarpool_myOffered") || "[]"); }
function saveMyOfferedIds(ids) { localStorage.setItem("tritonCarpool_myOffered", JSON.stringify(ids)); }


/* ============================================
   USER ROLES & PRICE MULTIPLIER
   From the original app:
   - Student: 0.5x price
   - Teacher: 0.5x price
   - Parent: 1.0x price
   - Alumni: 1.0x price
   ============================================ */

const roleMultipliers = {
    student: 0.5,
    teacher: 0.5,
    parent: 1.0,
    alumni: 1.0
};

function getUserRole() {
    return document.getElementById("user-role").value;
}

function getPriceForUser(basePrice) {
    const role = getUserRole();
    return basePrice * (roleMultipliers[role] || 1.0);
}

// Re-render when role changes
document.getElementById("user-role").addEventListener("change", () => {
    localStorage.setItem("tritonCarpool_role", getUserRole());
    renderRides(
        document.getElementById("filter-type").value,
        document.getElementById("search-input").value
    );
    renderMyRides();
});

// Restore saved role
if (localStorage.getItem("tritonCarpool_role")) {
    document.getElementById("user-role").value = localStorage.getItem("tritonCarpool_role");
}


/* ============================================
   DARK MODE
   ============================================ */

let themeButton = document.getElementById("theme-button");

const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
    themeButton.textContent = document.body.classList.contains("dark-mode") ? "Light Mode ☀️" : "Dark Mode 🌙";
    localStorage.setItem("tritonCarpool_darkMode", document.body.classList.contains("dark-mode"));
};

themeButton.addEventListener("click", toggleDarkMode);

if (localStorage.getItem("tritonCarpool_darkMode") === "true") {
    document.body.classList.add("dark-mode");
    themeButton.textContent = "Light Mode ☀️";
}


/* ============================================
   VEHICLE TYPE CONFIG
   ============================================ */

const vehicleEmoji = { car: "🚗", electric: "⚡", bicycle: "🚲", segway: "🛴", helicopter: "🚁" };

// Show/hide type-specific form fields
function toggleTypeFields() {
    document.querySelectorAll(".type-fields").forEach(el => el.style.display = "none");
    const type = document.getElementById("vehicle-type").value;
    const fields = document.getElementById("fields-" + type);
    if (fields) fields.style.display = "flex";
}

// Build specs HTML for a ride card
function specsHTML(ride) {
    const s = ride.specs || {};
    const tags = [];
    if (s.range) tags.push(`Range: ${s.range} mi`);
    if (s.bicycleType) tags.push(s.bicycleType);
    if (s.weight) tags.push(`${s.weight} lbs`);
    if (s.weightCapacity) tags.push(`Max ${s.weightCapacity} lbs`);
    if (s.maxAltitude) tags.push(`Alt: ${s.maxAltitude} ft`);
    if (s.maxAirSpeed) tags.push(`${s.maxAirSpeed} mph`);
    if (tags.length === 0) return "";
    return '<div class="ride-specs">' + tags.map(t => `<span class="spec-tag">${t}</span>`).join("") + '</div>';
}


/* ============================================
   RENDER RIDES (only open rides)
   ============================================ */

function renderRides(filter = "all", search = "") {
    const grid = document.getElementById("rides-grid");
    const noRides = document.getElementById("no-rides");
    let rides = getRides().filter(r => r.open); // only show OPEN rides

    if (filter !== "all") rides = rides.filter(r => r.vehicleType === filter);
    if (search.trim()) {
        const q = search.toLowerCase();
        rides = rides.filter(r =>
            r.destination.toLowerCase().includes(q) ||
            r.departure.toLowerCase().includes(q) ||
            r.driver.toLowerCase().includes(q) ||
            r.model.toLowerCase().includes(q)
        );
    }

    grid.innerHTML = "";
    if (rides.length === 0) { noRides.style.display = "block"; return; }
    noRides.style.display = "none";

    const role = getUserRole();
    const multiplier = roleMultipliers[role];
    const isDiscounted = multiplier < 1;

    rides.forEach(ride => {
        const card = document.createElement("div");
        card.className = "ride-card";
        const seatsLeft = ride.seats - ride.seatsBooked;
        const isFull = seatsLeft <= 0;
        const userPrice = getPriceForUser(ride.price);

        let priceDisplay;
        if (isDiscounted) {
            priceDisplay = `<span class="ride-price-original">$${ride.price.toFixed(2)}</span><span class="ride-price">$${userPrice.toFixed(2)}</span><span class="ride-price-discount">50% off</span>`;
        } else {
            priceDisplay = `<span class="ride-price">$${ride.price.toFixed(2)}</span>`;
        }

        card.innerHTML = `
            <div class="ride-card-header">
                <div class="ride-card-route">
                    <span>From</span>${ride.departure}
                    <span style="margin-top:0.5rem;">To</span>${ride.destination}
                </div>
                <span class="ride-card-type">${vehicleEmoji[ride.vehicleType] || "🚗"} ${ride.vehicleType}</span>
            </div>
            <div class="ride-card-details">
                <span>👤 ${ride.driver}</span>
                <span>🏷️ ${ride.model}</span>
                <span>📅 ${formatDate(ride.date)}</span>
                <span>🕐 ${formatTime(ride.time)}</span>
                <span>💺 ${isFull ? "FULL" : seatsLeft + " of " + ride.seats + " left"}</span>
            </div>
            ${specsHTML(ride)}
            <div class="ride-card-footer">
                <div>${priceDisplay} <small>/ seat</small></div>
                <div>
                    ${isFull
                        ? '<button class="btn btn-sm btn-danger" disabled>Full</button>'
                        : `<button class="btn btn-sm btn-book" onclick="bookRide(${ride.id})">Book Ride</button>`}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function formatDate(d) { return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",weekday:"short"}); }
function formatTime(t) { const [h,m]=t.split(":"); const hr=parseInt(h); return `${hr%12||12}:${m} ${hr>=12?"PM":"AM"}`; }


/* ============================================
   BOOK A RIDE
   ============================================ */

function bookRide(rideId) {
    let rides = getRides();
    const ride = rides.find(r => r.id === rideId);
    if (!ride || ride.seats - ride.seatsBooked <= 0) {
        showModal("Ride Full", "Sorry, no seats available.", false); return;
    }
    ride.seatsBooked += 1;
    saveRides(rides);

    const ids = getMyBookedIds();
    if (!ids.includes(rideId)) { ids.push(rideId); saveMyBookedIds(ids); }

    reRender();
    const userPrice = getPriceForUser(ride.price);
    showModal("Ride Booked! 🔱", `Booked with ${ride.driver} (${ride.model}) to ${ride.destination}. Your price: $${userPrice.toFixed(2)}. ${ride.seats - ride.seatsBooked} seat(s) left.`, true);
}


/* ============================================
   OPEN / CLOSE VEHICLE (Owner toggle)
   From design doc: only owners can open/close
   ============================================ */

function toggleOpen(rideId) {
    let rides = getRides();
    const ride = rides.find(r => r.id === rideId);
    if (!ride) return;
    ride.open = !ride.open;
    saveRides(rides);
    reRender();
    showModal(
        ride.open ? "Vehicle Opened 🟢" : "Vehicle Closed 🔴",
        `${ride.model} is now ${ride.open ? "open for bookings" : "closed — it won't appear in available rides"}.`,
        false
    );
}


/* ============================================
   DELETE A RIDE
   ============================================ */

function deleteRide(rideId) {
    saveRides(getRides().filter(r => r.id !== rideId));
    saveMyBookedIds(getMyBookedIds().filter(id => id !== rideId));
    saveMyOfferedIds(getMyOfferedIds().filter(id => id !== rideId));
    reRender();
}

function reRender() {
    renderRides(document.getElementById("filter-type").value, document.getElementById("search-input").value);
    renderMyRides();
    updateStats();
}


/* ============================================
   FORM VALIDATION
   ============================================ */

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    form.querySelectorAll(".field-error").forEach(el => el.textContent = "");
    form.querySelectorAll("input, select").forEach(el => el.classList.remove("input-error","input-success"));
}
function setFieldError(id, msg) {
    const f = document.getElementById(id); const e = document.getElementById("err-"+id);
    if(f) { f.classList.add("input-error"); f.classList.remove("input-success"); }
    if(e) e.textContent = msg;
}
function setFieldSuccess(id) {
    const f = document.getElementById(id); const e = document.getElementById("err-"+id);
    if(f) { f.classList.add("input-success"); f.classList.remove("input-error"); }
    if(e) e.textContent = "";
}

function validateRideForm() {
    clearFormErrors("ride-form");
    let ok = true;
    const v = id => document.getElementById(id).value.trim();

    if (!v("driver-name")) { setFieldError("driver-name","Enter your name."); ok=false; } else setFieldSuccess("driver-name");
    if (!v("vehicle-model")) { setFieldError("vehicle-model","Enter a vehicle model."); ok=false; } else setFieldSuccess("vehicle-model");
    if (!document.getElementById("vehicle-type").value) { setFieldError("vehicle-type","Select a type."); ok=false; } else setFieldSuccess("vehicle-type");
    if (!v("seats") || parseInt(v("seats"))<1) { setFieldError("seats","At least 1."); ok=false; } else setFieldSuccess("seats");
    const pr = v("price"); if(pr==="" || isNaN(parseFloat(pr)) || parseFloat(pr)<0) { setFieldError("price","Enter a valid price."); ok=false; } else setFieldSuccess("price");
    if (!v("departure")) { setFieldError("departure","Enter departure."); ok=false; } else setFieldSuccess("departure");
    if (!v("destination")) { setFieldError("destination","Enter destination."); ok=false; }
    else if (v("destination").toLowerCase()===v("departure").toLowerCase()) { setFieldError("destination","Same as departure."); ok=false; }
    else setFieldSuccess("destination");
    if (!v("ride-date")) { setFieldError("ride-date","Select a date."); ok=false; } else {
        const today = new Date(); today.setHours(0,0,0,0);
        if (new Date(v("ride-date")+"T00:00:00") < today) { setFieldError("ride-date","Can't be in the past."); ok=false; } else setFieldSuccess("ride-date");
    }
    if (!v("ride-time")) { setFieldError("ride-time","Select a time."); ok=false; } else setFieldSuccess("ride-time");
    return ok;
}

function validateConnectForm() {
    clearFormErrors("connect-form");
    let ok = true;
    const v = id => document.getElementById(id).value.trim();
    if (!v("connect-name") || v("connect-name").length<2) { setFieldError("connect-name","Enter a valid name."); ok=false; } else setFieldSuccess("connect-name");
    if (!document.getElementById("connect-college").value) { setFieldError("connect-college","Select college."); ok=false; } else setFieldSuccess("connect-college");
    const em = v("connect-email");
    if (!em || !em.includes("@") || !em.includes(".")) { setFieldError("connect-email","Enter a valid email."); ok=false; } else setFieldSuccess("connect-email");
    return ok;
}

// Real-time clear errors
document.querySelectorAll("#ride-form input, #ride-form select").forEach(el => {
    el.addEventListener("input", () => { const e=document.getElementById("err-"+el.id); if(e) e.textContent=""; el.classList.remove("input-error"); });
});
document.querySelectorAll("#connect-form input, #connect-form select").forEach(el => {
    el.addEventListener("input", () => { const e=document.getElementById("err-"+el.id); if(e) e.textContent=""; el.classList.remove("input-error"); });
});


/* ============================================
   OFFER A RIDE (Add Vehicle)
   ============================================ */

const rideForm = document.getElementById("ride-form");

rideForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateRideForm()) return;

    const type = document.getElementById("vehicle-type").value;
    let specs = {};

    // Collect type-specific fields (vehicle inheritance!)
    if (type === "car") specs = { range: parseInt(document.getElementById("car-range").value) || null };
    else if (type === "electric") specs = { range: parseInt(document.getElementById("electric-range").value) || null };
    else if (type === "bicycle") specs = { bicycleType: document.getElementById("bicycle-type").value || null, weight: parseInt(document.getElementById("bicycle-weight").value) || null };
    else if (type === "segway") specs = { range: parseInt(document.getElementById("segway-range").value) || null, weightCapacity: parseInt(document.getElementById("segway-weight-cap").value) || null };
    else if (type === "helicopter") specs = { maxAltitude: parseInt(document.getElementById("heli-altitude").value) || null, maxAirSpeed: parseInt(document.getElementById("heli-speed").value) || null };

    const newRide = {
        id: getNextId(),
        driver: document.getElementById("driver-name").value.trim(),
        model: document.getElementById("vehicle-model").value.trim(),
        vehicleType: type,
        departure: document.getElementById("departure").value.trim(),
        destination: document.getElementById("destination").value.trim(),
        date: document.getElementById("ride-date").value,
        time: document.getElementById("ride-time").value,
        seats: parseInt(document.getElementById("seats").value),
        seatsBooked: 0,
        price: parseFloat(document.getElementById("price").value),
        open: true,
        specs: specs
    };

    const rides = getRides(); rides.push(newRide); saveRides(rides);
    const ids = getMyOfferedIds(); ids.push(newRide.id); saveMyOfferedIds(ids);
    reRender();
    rideForm.reset(); clearFormErrors("ride-form");
    document.querySelectorAll(".type-fields").forEach(el => el.style.display = "none");
    showModal("Vehicle Added! 🔱", `${newRide.model} (${type}) posted from ${newRide.departure} to ${newRide.destination}. It's now open for bookings!`, true);
});


/* ============================================
   FILTER & SEARCH
   ============================================ */

document.getElementById("filter-type").addEventListener("change", () => reRender());
document.getElementById("search-input").addEventListener("input", () => reRender());


/* ============================================
   CONNECT FORM
   ============================================ */

let connectForm = document.getElementById("connect-form");
let connectCount = 3;

connectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateConnectForm()) return;

    const name = document.getElementById("connect-name").value.trim();
    const college = document.getElementById("connect-college").value;

    const newP = document.createElement("p");
    newP.textContent = `🔱 ${name} from ${college} College has connected.`;
    document.getElementById("connect-participants").appendChild(newP);

    const old = document.getElementById("connect-count"); old.remove();
    connectCount++;
    const counter = document.createElement("p"); counter.id = "connect-count";
    counter.textContent = "⭐ " + connectCount + " Tritons have joined the community!";
    const section = document.getElementById("connect");
    section.insertBefore(counter, section.querySelector(".form-container"));

    connectForm.reset(); clearFormErrors("connect-form");
    showModal("Welcome, Triton! 🔱", `${name} from ${college} College has joined!`, true);
});


/* ============================================
   MY RIDES (with Open/Close toggle for owners)
   ============================================ */

let currentMyRidesTab = "booked";

function switchTab(tab) {
    currentMyRidesTab = tab;
    document.getElementById("tab-booked").classList.toggle("active", tab === "booked");
    document.getElementById("tab-offered").classList.toggle("active", tab === "offered");
    renderMyRides();
}

function renderMyRides() {
    const grid = document.getElementById("my-rides-grid");
    const noRides = document.getElementById("no-my-rides");
    const all = getRides();
    const myIds = currentMyRidesTab === "booked" ? getMyBookedIds() : getMyOfferedIds();
    const myRides = all.filter(r => myIds.includes(r.id));
    const isOwnerView = currentMyRidesTab === "offered";

    grid.innerHTML = "";
    if (myRides.length === 0) {
        noRides.style.display = "block";
        noRides.textContent = isOwnerView ? "You haven't added any vehicles yet." : "You haven't booked any rides yet.";
        return;
    }
    noRides.style.display = "none";

    myRides.forEach(ride => {
        const card = document.createElement("div"); card.className = "ride-card";
        const seatsLeft = ride.seats - ride.seatsBooked;

        const statusBadge = isOwnerView
            ? `<span class="ride-status ${ride.open ? 'booked' : 'offered'}">${ride.open ? 'OPEN' : 'CLOSED'}</span>`
            : `<span class="ride-status booked">BOOKED</span>`;

        // Owners get Open/Close toggle button
        const ownerControls = isOwnerView ? `
            <button class="btn btn-sm ${ride.open ? 'btn-toggle-closed' : 'btn-toggle-open'}" onclick="toggleOpen(${ride.id})">
                ${ride.open ? '🔴 Close' : '🟢 Open'}
            </button>` : '';

        card.innerHTML = `
            <div class="ride-card-header">
                <div class="ride-card-route">
                    <span>From</span>${ride.departure}<span style="margin-top:0.5rem;">To</span>${ride.destination}
                </div>
                ${statusBadge}
            </div>
            <div class="ride-card-details">
                <span>👤 ${ride.driver}</span><span>🏷️ ${ride.model}</span>
                <span>📅 ${formatDate(ride.date)}</span><span>🕐 ${formatTime(ride.time)}</span>
                <span>💺 ${seatsLeft <= 0 ? "FULL" : seatsLeft + "/" + ride.seats}</span>
                <span>${vehicleEmoji[ride.vehicleType]||"🚗"} ${ride.vehicleType}</span>
            </div>
            ${specsHTML(ride)}
            <div class="ride-card-footer">
                <span class="ride-price">$${ride.price.toFixed(2)} <small>/ seat</small></span>
                <div>
                    ${ownerControls}
                    <button class="btn btn-sm btn-outline" onclick="deleteRide(${ride.id})" style="margin-left:0.5rem;">✕</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}


/* ============================================
   STATS
   ============================================ */

function updateStats() {
    const rides = getRides();
    animateCounter("stat-rides", rides.filter(r => r.open).length);
    animateCounter("stat-riders", rides.reduce((s,r) => s + r.seatsBooked, 0));
    animateCounter("stat-co2", Math.round(rides.reduce((s,r) => s + r.seatsBooked, 0) * 8.9));
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    const start = performance.now();
    (function update(now) {
        const p = Math.min((now-start)/1500, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1-p, 3)));
        if (p < 1) requestAnimationFrame(update);
    })(start);
}


/* ============================================
   MODAL + CONFETTI
   ============================================ */

function showModal(title, msg, confetti=false) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-message").textContent = msg;
    document.getElementById("modal-overlay").classList.add("show");
    if (confetti) launchConfetti();
}
function closeModal() { document.getElementById("modal-overlay").classList.remove("show"); }
document.getElementById("modal-overlay").addEventListener("click", e => { if(e.target===e.currentTarget) closeModal(); });

function launchConfetti() {
    const c = document.getElementById("confetti-canvas");
    const ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    const colors = ["#182B49","#006A96","#FFCD00","#00C6D7","#FC8900","#6E963B","#F3E500"];
    const particles = Array.from({length:120}, () => ({
        x: c.width/2+(Math.random()-0.5)*200, y: c.height/2,
        vx: (Math.random()-0.5)*16, vy: (Math.random()-1)*18-4,
        color: colors[Math.floor(Math.random()*colors.length)],
        size: Math.random()*8+4, rot: Math.random()*360,
        rs: (Math.random()-0.5)*12, g: 0.25+Math.random()*0.15, o: 1,
        shape: Math.random()>0.5?"r":"c"
    }));
    const t0 = performance.now(), dur = 2500;
    (function draw(now) {
        const el = now-t0;
        if (el > dur) { ctx.clearRect(0,0,c.width,c.height); return; }
        ctx.clearRect(0,0,c.width,c.height);
        particles.forEach(p => {
            p.x+=p.vx; p.vy+=p.g; p.y+=p.vy; p.rot+=p.rs; p.vx*=0.99;
            if (el>dur*0.7) p.o=Math.max(0,1-(el-dur*0.7)/(dur*0.3));
            ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
            ctx.globalAlpha=p.o; ctx.fillStyle=p.color;
            p.shape==="r" ? ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)
              : (ctx.beginPath(), ctx.arc(0,0,p.size/2,0,Math.PI*2), ctx.fill());
            ctx.restore();
        });
        requestAnimationFrame(draw);
    })(t0);
}

window.addEventListener("resize", () => {
    const c = document.getElementById("confetti-canvas");
    c.width = window.innerWidth; c.height = window.innerHeight;
});


/* ============================================
   SCROLL ANIMATIONS
   ============================================ */

let revealableContainers = document.querySelectorAll(".revealable");

const reveal = () => {
    for (let i = 0; i < revealableContainers.length; i++) {
        const el = revealableContainers[i];
        const top = el.getBoundingClientRect().top;
        const dist = parseInt(getComputedStyle(el).getPropertyValue('--reveal-distance'), 10);
        el.classList.toggle("active", top < window.innerHeight - dist);
    }
};

window.addEventListener("scroll", reveal);


/* ============================================
   INIT
   ============================================ */

(function init() {
    renderRides();
    renderMyRides();
    updateStats();
    reveal();
})();
