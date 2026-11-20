// State loaded from localStorage (backed by initialBooks from books.js)
let books = JSON.parse(localStorage.getItem("lib_v2_books")) || initialBooks;
let users = JSON.parse(localStorage.getItem("lib_v2_users")) || [
  {
    id: "STU101",
    name: "Sajan Shrestha",
    role: "Student",
    password: "1234",
    reserved: [],
    purchased: [],
  },
];
let currentUser = JSON.parse(localStorage.getItem("lib_v2_user")) || null;
let readingList = JSON.parse(localStorage.getItem("lib_v2_favs")) || [];
let tickets = JSON.parse(localStorage.getItem("lib_v2_tickets")) || [];
let selectedGenre = "All";

function saveAll() {
  localStorage.setItem("lib_v2_books", JSON.stringify(books));
  localStorage.setItem("lib_v2_users", JSON.stringify(users));
  localStorage.setItem("lib_v2_user", JSON.stringify(currentUser));
  localStorage.setItem("lib_v2_favs", JSON.stringify(readingList));
  localStorage.setItem("lib_v2_tickets", JSON.stringify(tickets));
}

// Create Book Card HTML
function createBookCard(book) {
  const isFav = readingList.includes(book.id);
  const available = book.copies > 0;

  return `
    <div class="book-card">
      <div class="book-cover" style="background:${book.coverColor}" onclick="openBookModal(${book.id})">
        <div class="book-cover-top">
          <span>${book.genre}</span>
          <button class="fav-toggle" onclick="event.stopPropagation(); toggleFavorite(${book.id})" title="Save to Reading List">
            ${isFav ? "❤️ Saved" : "🤍 Save"}
          </button>
        </div>
        <strong>${book.title}</strong>
      </div>
      <div class="book-body">
        <h3 class="book-title" onclick="openBookModal(${book.id})">${book.title}</h3>
        <p class="book-author">by ${book.author} (${book.year})</p>
        <div class="book-meta">
          <span class="${available ? "badge-avail" : "badge-out"}">
            ${available ? `${book.copies} Available` : "Checked Out"}
          </span>
          <strong>€${book.price.toFixed(2)}</strong>
        </div>
        <div class="card-actions">
          <button class="btn-reserve ${!available ? "btn-disabled" : ""}" onclick="reserveBook(${book.id})" ${!available ? "disabled" : ""}>
            Reserve
          </button>
          <button class="btn-buy ${!available ? "btn-disabled" : ""}" onclick="buyBook(${book.id})" ${!available ? "disabled" : ""}>
            Buy
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render Featured & Main Catalog
function renderAllBooks() {
  const featuredBooks = books.filter((b) => b.featured);
  document.getElementById("featuredGrid").innerHTML = featuredBooks
    .map(createBookCard)
    .join("");

  const query = document.getElementById("catalogSearch").value.toLowerCase();
  const filtered = books.filter((b) => {
    const matchText =
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query);
    const matchGenre = selectedGenre === "All" || b.genre === selectedGenre;
    return matchText && matchGenre;
  });

  document.getElementById("catalogGrid").innerHTML = filtered.length
    ? filtered.map(createBookCard).join("")
    : "<p>No books match your current filter.</p>";
}

// Book Details Modal
window.openBookModal = function (id) {
  const book = books.find((b) => b.id === id);
  if (!book) return;
  const available = book.copies > 0;

  document.getElementById("bookModalBody").innerHTML = `
    <span style="color:var(--accent);font-weight:700;font-size:0.85rem;">${book.genre} · Published ${book.year}</span>
    <h2 style="margin:0.4rem 0;">${book.title}</h2>
    <p style="color:var(--muted);margin-bottom:1rem;">Author: <strong>${book.author}</strong></p>
    <p style="margin-bottom:1.2rem;">${book.description}</p>
    <p style="margin-bottom:1rem;">
      Status: <strong>${available ? `${book.copies} copies available` : "Currently Checked Out"}</strong> |
      Purchase Price: <strong>€${book.price.toFixed(2)}</strong>
    </p>
    <div class="card-actions">
      <button class="btn-reserve ${!available ? "btn-disabled" : ""}" onclick="reserveBook(${book.id}); closeModal('bookModal')" ${!available ? "disabled" : ""}>
        Reserve Copy (Members)
      </button>
      <button class="btn-buy ${!available ? "btn-disabled" : ""}" onclick="buyBook(${book.id}); closeModal('bookModal')" ${!available ? "disabled" : ""}>
        Buy Book (€${book.price.toFixed(2)})
      </button>
    </div>
  `;
  document.getElementById("bookModal").classList.remove("hidden");
};

// Reading List (Bookmarking)
window.toggleFavorite = function (id) {
  if (readingList.includes(id)) {
    readingList = readingList.filter((item) => item !== id);
  } else {
    readingList.push(id);
  }
  saveAll();
  renderAllBooks();
  renderReadingList();
};

function renderReadingList() {
  document.getElementById("favCount").textContent = readingList.length;
  const listEl = document.getElementById("readingListItems");
  const savedBooks = books.filter((b) => readingList.includes(b.id));

  listEl.innerHTML = savedBooks.length
    ? savedBooks
        .map(
          (b) => `
        <li>
          <span><strong>${b.title}</strong><br><small>${b.author}</small></span>
          <button class="btn-danger" onclick="toggleFavorite(${b.id})">Remove</button>
        </li>
      `,
        )
        .join("")
    : "<li>Your reading list is empty. Click 'Save' on any book card!</li>";
}
// Registered Member Actions: Reserve & Buy
window.reserveBook = function (id) {
  if (!currentUser) {
    alert(
      "Registered Students & Members Only: Please log in or register to reserve books.",
    );
    document.getElementById("authModal").classList.remove("hidden");
    return;
  }
  const book = books.find((b) => b.id === id);
  if (book && book.copies > 0) {
    book.copies -= 1;
    currentUser.reserved.push({
      title: book.title,
      date: new Date().toLocaleDateString(),
    });
    syncUser();
    saveAll();
    renderAllBooks();
    updateUI();
    alert(
      `Reserved "${book.title}" for ${currentUser.name} (${currentUser.id}). Pick up within 48 hours.`,
    );
  }
};

window.buyBook = function (id) {
  if (!currentUser) {
    alert(
      "Registered Students & Members Only: Please log in or register to buy books.",
    );
    document.getElementById("authModal").classList.remove("hidden");
    return;
  }
  const book = books.find((b) => b.id === id);
  if (book && book.copies > 0) {
    book.copies -= 1;
    currentUser.purchased.push({ title: book.title, price: book.price });
    syncUser();
    saveAll();
    renderAllBooks();
    updateUI();
    alert(
      `Purchased "${book.title}" for €${book.price.toFixed(2)}. Added to My Books!`,
    );
  }
};

function syncUser() {
  const idx = users.findIndex((u) => u.id === currentUser.id);
  if (idx !== -1) users[idx] = currentUser;
}

// Auth & Account UI
function updateUI() {
  const loggedIn = Boolean(currentUser);
  document.getElementById("guestNotice").classList.toggle("hidden", loggedIn);
  document.getElementById("openAuthBtn").classList.toggle("hidden", loggedIn);
  document.getElementById("logoutBtn").classList.toggle("hidden", !loggedIn);
  document.getElementById("userBadge").classList.toggle("hidden", !loggedIn);
  document.getElementById("myAccountBtn").classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    document.getElementById("userBadge").textContent =
      `👤 ${currentUser.name} (${currentUser.role})`;
    document.getElementById("myBooksCount").textContent =
      currentUser.reserved.length + currentUser.purchased.length;
    document.getElementById("helpName").value = currentUser.name;
    document.getElementById("helpMemberId").value = currentUser.id;
  }
}
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("loginId").value.trim();
  const pass = document.getElementById("loginPass").value;
  const user = users.find(
    (u) => u.id.toLowerCase() === id.toLowerCase() && u.password === pass,
  );
  if (!user) return alert("Invalid Member ID or Password. Try STU101 / 1234.");
  currentUser = user;
  saveAll();
  updateUI();
  closeModal("authModal");
  e.target.reset();
});

document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const role = document.getElementById("regRole").value;
  const id = document.getElementById("regId").value.trim();
  const password = document.getElementById("regPass").value;
  if (users.some((u) => u.id.toLowerCase() === id.toLowerCase())) {
    return alert("That Member ID is already taken.");
  }
  const newUser = { id, name, role, password, reserved: [], purchased: [] };
  users.push(newUser);
  currentUser = newUser;
  saveAll();
  updateUI();
  closeModal("authModal");
  e.target.reset();
  alert(`Registration complete! Welcome, ${name}.`);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  saveAll();
  updateUI();
});

// My Books Modal (Individual Cancel / Return for Reserved & Purchased Books)
document
  .getElementById("myAccountBtn")
  .addEventListener("click", renderMyBooksModal);

function renderMyBooksModal() {
  const resList = document.getElementById("userReservedList");
  const purList = document.getElementById("userPurchasedList");

  resList.innerHTML = currentUser.reserved.length
    ? currentUser.reserved
        .map(
          (r, index) => `
          <li>
            <span><strong>${r.title}</strong><br><small>Reserved: ${r.date}</small></span>
            <button class="btn-danger" onclick="cancelReservation(${index})">Cancel</button>
          </li>`,
        )
        .join("")
    : "<li>No books reserved yet.</li>";

  let total = 0;
  purList.innerHTML = currentUser.purchased.length
    ? currentUser.purchased
        .map((p, index) => {
          total += p.price;
          return `
          <li>
            <span><strong>${p.title}</strong><br><small>€${p.price.toFixed(2)}</small></span>
            <button class="btn-danger" onclick="cancelPurchase(${index})">Cancel</button>
          </li>`;
        })
        .join("")
    : "<li>No books purchased yet.</li>";

  document.getElementById("userTotalSpent").textContent = total.toFixed(2);
  document.getElementById("accountModal").classList.remove("hidden");
}

window.cancelReservation = function (index) {
  const item = currentUser.reserved[index];
  if (!confirm(`Cancel reservation for "${item.title}"?`)) return;

  const book = books.find((b) => b.title === item.title);
  if (book) book.copies += 1;

  currentUser.reserved.splice(index, 1);
  syncUser();
  saveAll();
  renderAllBooks();
  updateUI();
  renderMyBooksModal();
};

window.cancelPurchase = function (index) {
  const item = currentUser.purchased[index];
  if (
    !confirm(
      `Cancel purchase and refund €${item.price.toFixed(2)} for "${item.title}"?`,
    )
  )
    return;

  const book = books.find((b) => b.title === item.title);
  if (book) book.copies += 1;

  currentUser.purchased.splice(index, 1);
  syncUser();
  saveAll();
  renderAllBooks();
  updateUI();
  renderMyBooksModal();
};

// Staff Helpdesk Form
document.getElementById("staffHelpForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const ticket = {
    id: "STAFF-" + Math.floor(100 + Math.random() * 900),
    name: document.getElementById("helpName").value.trim(),
    memberId: document.getElementById("helpMemberId").value.trim() || "Visitor",
    topic: document.getElementById("helpTopic").value,
    message: document.getElementById("helpMessage").value.trim(),
  };
  tickets.unshift(ticket);
  saveAll();
  renderTickets();
  e.target.reset();
  alert(`Request ${ticket.id} sent to Library Staff!`);
});

function renderTickets() {
  const feed = document.getElementById("ticketFeed");
  feed.innerHTML = tickets
    .slice(0, 3)
    .map(
      (t) => `
    <div class="ticket-item">
      <strong>[${t.id}] ${t.topic}</strong> — <em>Sent to Library Desk</em><br>
      <small>${t.name} (${t.memberId}): "${t.message}"</small>
    </div>
  `,
    )
    .join("");
}

// Search & Genre Filter Events
document
  .getElementById("catalogSearch")
  .addEventListener("input", renderAllBooks);
document.getElementById("heroSearchBtn").addEventListener("click", () => {
  document.getElementById("catalogSearch").value =
    document.getElementById("heroSearchInput").value;
  renderAllBooks();
  document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".genre-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".genre-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedGenre = btn.dataset.genre;
    renderAllBooks();
  });
});

// Dark Mode Toggle
const darkModeBtn = document.getElementById("darkModeBtn");
if (localStorage.getItem("lib_v2_dark") === "true") {
  document.body.classList.add("dark-mode");
  darkModeBtn.textContent = "☀️";
}
darkModeBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("lib_v2_dark", isDark);
  darkModeBtn.textContent = isDark ? "☀️" : "🌙";
});

// Drawer & Modal Controls
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}
document
  .getElementById("readingListBtn")
  .addEventListener("click", () =>
    document.getElementById("readingDrawer").classList.remove("hidden"),
  );
document
  .getElementById("closeDrawerBtn")
  .addEventListener("click", () => closeModal("readingDrawer"));
document
  .getElementById("openAuthBtn")
  .addEventListener("click", () =>
    document.getElementById("authModal").classList.remove("hidden"),
  );
document.getElementById("bannerLoginLink").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("authModal").classList.remove("hidden");
});
document
  .getElementById("closeAuthModal")
  .addEventListener("click", () => closeModal("authModal"));
document
  .getElementById("closeBookModal")
  .addEventListener("click", () => closeModal("bookModal"));
document
  .getElementById("closeAccountModal")
  .addEventListener("click", () => closeModal("accountModal"));

document.getElementById("tabLogin").addEventListener("click", () => {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("tabLogin").classList.add("active");
  document.getElementById("tabRegister").classList.remove("active");
});
document.getElementById("tabRegister").addEventListener("click", () => {
  document.getElementById("registerForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("tabRegister").classList.add("active");
  document.getElementById("tabLogin").classList.remove("active");
});

// Initialize
renderAllBooks();
renderReadingList();
updateUI();
renderTickets();
