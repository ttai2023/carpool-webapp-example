/*** ============================================================
     TRITON CARPOOL — API DEMO (script.js)
     Features: Weather API, Dark Mode, Rides, Connect Form
     ============================================================ ***/


/*** Dark Mode ***/
let themeButton = document.getElementById("theme-button");

const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
    themeButton.textContent = document.body.classList.contains("dark-mode")
        ? "Light Mode ☀️"
        : "Dark Mode 🌙";
};

themeButton.addEventListener("click", toggleDarkMode);


/*** Scroll Reveal ***/
let revealableContainers = document.querySelectorAll(".revealable");

const reveal = () => {
    for (let i = 0; i < revealableContainers.length; i++) {
        let current = revealableContainers[i];
        let windowHeight = window.innerHeight;
        let topOfContainer = current.getBoundingClientRect().top;
        let revealDistance = parseInt(
            getComputedStyle(current).getPropertyValue("--reveal-distance"), 10
        );
        if (topOfContainer < windowHeight - revealDistance) {
            current.classList.add("active");
        } else {
            current.classList.remove("active");
        }
    }
};

window.addEventListener("scroll", reveal);
reveal();


/*** ============================================================
     WEATHER API — The main demo feature!
     Uses wttr.in (free, no API key required)
     ============================================================ ***/

let weatherBtn = document.getElementById("weather-btn");

const fetchWeather = () => {
    let city = document.getElementById("city-input").value.trim();

    if (!city) {
        document.getElementById("weather-result").innerHTML =
            '<p style="color:#ef4444;">Please enter a city name!</p>';
        return;
    }

    // Show loading state
    document.getElementById("weather-result").innerHTML =
        '<p><span class="loading-spinner"></span> Calling the weather API...</p>';
    document.getElementById("raw-json").textContent = "Loading...";

    // Build the API endpoint URL
    let url = "https://wttr.in/" + encodeURIComponent(city) + "?format=j1";

    // Fetch the data!
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("API returned status " + response.status);
            }
            return response.json();
        })
        .then(data => {
            let current = data.current_condition[0];
            let temp_F = current.temp_F;
            let temp_C = current.temp_C;
            let desc = current.weatherDesc[0].value;
            let humidity = current.humidity;
            let windSpeed = current.windspeedMiles;
            let feelsLike = current.FeelsLikeF;

            // Display the weather data
            document.getElementById("weather-result").innerHTML = `
                <div class="weather-data">
                    <div class="weather-stat">
                        <span class="big">${temp_F}°F</span>
                        <span class="label">(${temp_C}°C) Temperature</span>
                    </div>
                    <div class="weather-stat">
                        <span class="big">${desc}</span>
                        <span class="label">Conditions</span>
                    </div>
                    <div class="weather-stat">
                        <span class="big">${humidity}%</span>
                        <span class="label">Humidity</span>
                    </div>
                    <div class="weather-stat">
                        <span class="big">${windSpeed} mph</span>
                        <span class="label">Wind Speed</span>
                    </div>
                    <div class="weather-stat">
                        <span class="big">${feelsLike}°F</span>
                        <span class="label">Feels Like</span>
                    </div>
                </div>
            `;

            // Show raw JSON for demo purposes
            document.getElementById("raw-json").textContent =
                JSON.stringify(current, null, 2);
        })
        .catch(error => {
            document.getElementById("weather-result").innerHTML =
                '<p style="color:#ef4444;">❌ Could not fetch weather for "' +
                city + '". Check the city name and try again!</p>';
            document.getElementById("raw-json").textContent = "Error: " + error.message;
        });
};

weatherBtn.addEventListener("click", fetchWeather);

document.getElementById("city-input").addEventListener("keypress", (event) => {
    if (event.key === "Enter") fetchWeather();
});


/*** ============================================================
     RIDES — Simple in-memory ride system
     (In a real app, this would use a database via API!)
     ============================================================ ***/

let rides = [
    {
        id: 1, driver: "King Triton", vehicle: "Tesla Model 3", type: "electric",
        seats: 4, booked: 1, price: 10.00,
        departure: "Geisel Library", destination: "Old Town San Diego"
    },
    {
        id: 2, driver: "Sandy Shores", vehicle: "Honda Civic", type: "car",
        seats: 3, booked: 0, price: 8.00,
        departure: "Price Center", destination: "UTC Mall"
    },
    {
        id: 3, driver: "Wave Rider", vehicle: "Trek FX3", type: "bicycle",
        seats: 1, booked: 0, price: 0.00,
        departure: "Sixth College", destination: "La Jolla Shores"
    }
];

let nextId = 4;

const typeEmoji = { car: "🚗", electric: "⚡", bicycle: "🚲" };

const renderRides = (filter = "all", search = "") => {
    let grid = document.getElementById("rides-grid");
    let noRides = document.getElementById("no-rides");
    grid.innerHTML = "";

    let filtered = rides.filter(r => {
        let matchesType = filter === "all" || r.type === filter;
        let matchesSearch = search === "" ||
            r.destination.toLowerCase().includes(search.toLowerCase()) ||
            r.driver.toLowerCase().includes(search.toLowerCase()) ||
            r.vehicle.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch && r.booked < r.seats;
    });

    if (filtered.length === 0) {
        noRides.style.display = "block";
        return;
    }
    noRides.style.display = "none";

    filtered.forEach(ride => {
        let card = document.createElement("div");
        card.className = "ride-card";
        card.innerHTML = `
            <h4>${typeEmoji[ride.type] || "🚗"} ${ride.vehicle}</h4>
            <p><strong>Driver:</strong> ${ride.driver}</p>
            <p><strong>Route:</strong> ${ride.departure} → ${ride.destination}</p>
            <div class="ride-meta">
                <span class="ride-tag">${ride.seats - ride.booked} seat${ride.seats - ride.booked !== 1 ? "s" : ""} left</span>
                <span class="ride-tag">${ride.price === 0 ? "Free!" : "$" + ride.price.toFixed(2)}</span>
                <span class="ride-tag">${ride.type}</span>
            </div>
            <button class="btn btn-gold" onclick="bookRide(${ride.id})">Book Seat 🎟️</button>
        `;
        grid.appendChild(card);
    });
};

const bookRide = (id) => {
    let ride = rides.find(r => r.id === id);
    if (ride && ride.booked < ride.seats) {
        ride.booked++;
        renderRides(
            document.getElementById("filter-type").value,
            document.getElementById("search-input").value
        );
        showModal("Ride Booked!", `You booked a seat on ${ride.driver}'s ${ride.vehicle}. ${ride.departure} → ${ride.destination}.`);
    }
};

// Filter & search listeners
document.getElementById("filter-type").addEventListener("change", () => {
    renderRides(
        document.getElementById("filter-type").value,
        document.getElementById("search-input").value
    );
});

document.getElementById("search-input").addEventListener("input", () => {
    renderRides(
        document.getElementById("filter-type").value,
        document.getElementById("search-input").value
    );
});

// Initial render
renderRides();


/*** Offer a Ride Form ***/
document.getElementById("ride-form").addEventListener("submit", (event) => {
    event.preventDefault();

    // Simple validation
    let driverName = document.getElementById("driver-name").value.trim();
    let vehicleModel = document.getElementById("vehicle-model").value.trim();
    let vehicleType = document.getElementById("vehicle-type").value;
    let seats = parseInt(document.getElementById("seats").value);
    let price = parseFloat(document.getElementById("price").value);
    let departure = document.getElementById("departure").value.trim();
    let destination = document.getElementById("destination").value.trim();

    let valid = true;

    const setError = (id, msg) => { document.getElementById(id).textContent = msg; };
    const clearErrors = () => {
        document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
    };
    clearErrors();

    if (!driverName) { setError("err-driver-name", "Name is required"); valid = false; }
    if (!vehicleModel) { setError("err-vehicle-model", "Vehicle is required"); valid = false; }
    if (!vehicleType) { setError("err-vehicle-type", "Select a type"); valid = false; }
    if (!seats || seats < 1) { setError("err-seats", "At least 1 seat"); valid = false; }
    if (isNaN(price) || price < 0) { setError("err-price", "Enter a valid price"); valid = false; }
    if (!departure) { setError("err-departure", "Departure is required"); valid = false; }
    if (!destination) { setError("err-destination", "Destination is required"); valid = false; }

    if (!valid) return;

    rides.push({
        id: nextId++,
        driver: driverName,
        vehicle: vehicleModel,
        type: vehicleType,
        seats: seats,
        booked: 0,
        price: price,
        departure: departure,
        destination: destination
    });

    renderRides(
        document.getElementById("filter-type").value,
        document.getElementById("search-input").value
    );

    document.getElementById("ride-form").reset();
    clearErrors();

    showModal("Ride Posted!", `${driverName}'s ${vehicleModel} is now available. ${departure} → ${destination}.`);
});


/*** Connect Form ***/
let connectCount = 3;

document.getElementById("connect-form").addEventListener("submit", (event) => {
    event.preventDefault();

    let name = document.getElementById("connect-name").value.trim();
    let college = document.getElementById("connect-college").value;
    let email = document.getElementById("connect-email").value.trim();

    // Clear errors
    document.querySelectorAll(".field-error").forEach(el => el.textContent = "");

    let valid = true;
    if (!name) { document.getElementById("err-connect-name").textContent = "Name is required"; valid = false; }
    if (!college) { document.getElementById("err-connect-college").textContent = "Select a college"; valid = false; }
    if (!email || !email.includes("@")) { document.getElementById("err-connect-email").textContent = "Enter a valid email"; valid = false; }

    if (!valid) return;

    // Add participant to the list
    connectCount++;
    let participants = document.getElementById("connect-participants");
    let newP = document.createElement("p");
    newP.textContent = `🔱 ${name} from ${college} College has connected.`;
    participants.appendChild(newP);

    // Update count
    document.getElementById("connect-count").textContent =
        `⭐ ${connectCount} Tritons have joined the community!`;

    document.getElementById("connect-form").reset();

    showModal("Welcome, Triton!", `${name} from ${college} College has joined the community!`);
});


/*** Modal ***/
const showModal = (title, message) => {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-message").textContent = message;
    document.getElementById("modal-overlay").classList.add("show");
};

const closeModal = () => {
    document.getElementById("modal-overlay").classList.remove("show");
};

// Close modal on overlay click
document.getElementById("modal-overlay").addEventListener("click", (event) => {
    if (event.target === document.getElementById("modal-overlay")) closeModal();
});