// ==========================================
// 1. SUPABASE INICIALIZÁLÁS
// ==========================================
const SUPABASE_URL = 'https://qsiaaugwmfhkuimerqjo.supabase.co'; // <-- IDE ÍRD A SAJÁTODAT
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzaWFhdWd3bWZoa3VpbWVycWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzYyNjYsImV4cCI6MjA4OTMxMjI2Nn0.e_asjzYaJBETkQmKq2cvPbqyKQHCph8-7MAYeA_xvxg'; // <-- IDE ÍRD A SAJÁTODAT

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. ÁLLÁSOK LEKÉRÉSE ÉS SZŰRÉSE (Supabase-ből)
// ==========================================
let allJobs = []; // Itt tároljuk az összes állást, amit az adatbázisból hoztunk

async function fetchAndRenderJobs() {
    const container = document.getElementById('job-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:var(--gray); padding:20px;">Állások betöltése...</p>';

    // Lekérjük az összes állást a Supabase-ből
    const { data: jobs, error } = await supabaseClient
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Hiba az állások betöltésekor:', error);
        container.innerHTML = '<p style="text-align:center; color:red; padding:20px;">Hiba történt az állások betöltésekor.</p>';
        return;
    }

    allJobs = jobs; // Eltároljuk globálisan a szűréshez
    applyFilters(); // Meghívjuk a szűrőt, ami megjeleníti őket
}

function applyFilters() {
    const container = document.getElementById('job-container');
    if (!container) return;

    const keyword = document.getElementById('search-keyword')?.value.toLowerCase() || '';
    const location = document.getElementById('search-location')?.value.toLowerCase() || '';
    
    const types = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);
    const exps = Array.from(document.querySelectorAll('.filter-exp:checked')).map(cb => cb.value);

    // Szűrés a betöltött adatokon
    const filtered = allJobs.filter(job => {
        const matchKeyword = job.title.toLowerCase().includes(keyword) || job.company.toLowerCase().includes(keyword);
        const matchLocation = job.location.toLowerCase().includes(location);
        const matchType = types.length === 0 || types.includes(job.type);
        const matchExp = exps.length === 0 || exps.includes(job.experience);
        
        return matchKeyword && matchLocation && matchType && matchExp;
    });

    renderJobs(filtered);
}

// --- renderJobs frissítése ---
function renderJobs(jobs) {
    const container = document.getElementById('job-container');
    if (!container) return;

    container.innerHTML = '';
    if (jobs.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--gray); padding:20px;">Nincs a szűrésnek megfelelő állás.</p>';
        return;
    }

    const favorites = JSON.parse(localStorage.getItem('vant_favorites')) || [];

    jobs.forEach(job => {
        const isSaved = favorites.includes(job.id);
        
        // Kattintás esemény hozzáadása a kártyához
        container.innerHTML += `
            <div class="job-card" onclick="openJobModal(${JSON.stringify(job).replace(/"/g, '&quot;')})">
                <div class="company-logo" style="color: ${job.color || '#e11d48'};">${job.logo || 'V'}</div>
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="company">${job.company}</div>
                    <div class="tags">
                        <span class="tag">${job.location}</span>
                        <span class="tag">${job.type}</span>
                        <span class="tag">${job.experience}</span>
                    </div>
                    <div class="job-salary">${job.salary}</div>
                </div>
                <!-- A csillag gombra kattintás ne nyissa meg a modalt, ezért megállítjuk az eseményt -->
                <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleFavorite(${job.id}, this)">
                    ${isSaved ? '★' : '☆'}
                </button>
            </div>
        `;
    });
}

// --- Új függvények a modal kezeléséhez ---

function openJobModal(job) {
    const modal = document.getElementById('job-modal');
    if (!modal) return;

    // Adatok betöltése a modalba
    document.getElementById('modal-title').textContent = job.title;
    document.getElementById('modal-company').textContent = job.company;
    document.getElementById('modal-logo').textContent = job.logo || 'V';
    document.getElementById('modal-logo').style.color = job.color || '#e11d48';
    document.getElementById('modal-salary').textContent = job.salary;
    
    // Leírás és elvárások (ha nincs az adatbázisban, alapértelmezett szöveget mutatunk)
    document.getElementById('modal-description').textContent = job.description || "Ehhez az álláshoz még nem tartozik részletes leírás.";
    document.getElementById('modal-requirements').textContent = job.requirements || "Nincs megadva konkrét elvárás.";

    // Tagek
    document.getElementById('modal-tags').innerHTML = `
        <span class="tag" style="font-size: 14px; padding: 6px 12px;">${job.location}</span>
        <span class="tag" style="font-size: 14px; padding: 6px 12px;">${job.type}</span>
        <span class="tag" style="font-size: 14px; padding: 6px 12px;">${job.experience}</span>
    `;

    // Gomb szövegének átírása, hogy tudjuk, melyik állásra jelentkezünk
    const applyBtn = modal.querySelector('.btn-primary');
    applyBtn.onclick = () => {
        alert(`Sikeresen jelentkeztél a(z) "${job.title}" pozícióra! (Ez egy demó értesítés.)`);
        closeJobModal();
    };

    // Modal megjelenítése
    modal.style.display = 'flex';
}

function closeJobModal() {
    document.getElementById('job-modal').style.display = 'none';
}

// Ha a felhasználó az ablakon kívülre kattint, zárjuk be a modalt
document.addEventListener('click', function(event) {
    const modal = document.getElementById('job-modal');
    if (event.target === modal) {
        closeJobModal();
    }
});

// ==========================================
// 3. KEDVENCEK KEZELÉSE (LocalStorage)
// ==========================================
function toggleFavorite(id, btn) {
    let favorites = JSON.parse(localStorage.getItem('vant_favorites')) || [];
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        btn.classList.remove('saved');
        btn.innerHTML = '☆';
    } else {
        favorites.push(id);
        btn.classList.add('saved');
        btn.innerHTML = '★';
    }
    
    localStorage.setItem('vant_favorites', JSON.stringify(favorites));
}

function renderFavorites() {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem('vant_favorites')) || [];
    // Mivel a kedvencek oldalon nincs betöltve az összes állás, itt is le kell kérnünk
    // Egyszerűség kedvéért most a localStorage-ban tárolt ID-k alapján szűrünk, de ideális esetben itt is Supabase-ből kérnénk le a konkrét állásokat.
    // Egyelőre a korábbi mock adatok helyett itt is a globális allJobs-t használjuk, ha betöltődött.
    
    if (allJobs.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--gray); padding:40px;">Betöltés...</p>';
        // Ha közvetlenül a kedvencek oldalra lépünk, le kell kérnünk az állásokat
        supabaseClient.from('jobs').select('*').then(({data}) => {
            if(data) {
                allJobs = data;
                renderFavorites(); // Újra meghívjuk magunkat
            }
        });
        return;
    }

    const favJobs = allJobs.filter(job => favorites.includes(job.id));

    container.innerHTML = '';
    if (favJobs.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--gray); padding:40px;">Még nincs mentett állásod. Kattints a csillagra az állásoknál!</p>';
        return;
    }

    favJobs.forEach(job => {
        container.innerHTML += `
            <div class="job-card">
                <div class="company-logo" style="color: ${job.color || '#e11d48'};">${job.logo || 'V'}</div>
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="company">${job.company}</div>
                    <div class="tags">
                        <span class="tag">${job.location}</span>
                        <span class="tag">${job.type}</span>
                    </div>
                    <div class="job-salary">${job.salary}</div>
                </div>
                <button class="bookmark-btn saved" onclick="toggleFavorite(${job.id}, this); renderFavorites();">★</button>
            </div>
        `;
    });
}

// ==========================================
// 4. ÖNÉLETRAJZ (CV) LOGIKA (Változatlan)
// ==========================================
let currentStep = 1;

function showStep(step) {
    currentStep = step;
    document.querySelectorAll('.cv-step').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-list li').forEach(el => el.classList.remove('active'));
    
    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) stepEl.classList.add('active');
    
    const stepLi = document.querySelectorAll('.step-list li')[step - 1];
    if (stepLi) stepLi.classList.add('active');
}

function nextStep() { if (currentStep < 4) showStep(currentStep + 1); }
function prevStep() { if (currentStep > 1) showStep(currentStep - 1); }

function updatePreview() {
    const name = document.getElementById('cv-name')?.value || "Kovács Bence";
    const email = document.getElementById('cv-email')?.value || "bence.kovacs@email.hu";
    const phone = document.getElementById('cv-phone')?.value || "+36 30 123 4567";
    const loc = document.getElementById('cv-location')?.value || "Miskolc";
    const bio = document.getElementById('cv-bio')?.value || "Rövid bemutatkozás...";
    const position = document.getElementById('cv-position')?.value || "Junior Fejlesztő";
    const company = document.getElementById('cv-company')?.value || "Tech Solutions Kft.";
    const period = document.getElementById('cv-period')?.value || "2022 - 2024";
    const school = document.getElementById('cv-school')?.value || "Miskolci Egyetem";
    const degree = document.getElementById('cv-degree')?.value || "Programtervező informatikus";
    const skills = document.getElementById('cv-skills')?.value || "HTML, CSS, JavaScript, Python";

    if (document.getElementById('preview-name')) document.getElementById('preview-name').textContent = name;
    if (document.getElementById('preview-email')) document.getElementById('preview-email').textContent = email;
    if (document.getElementById('preview-phone')) document.getElementById('preview-phone').textContent = phone;
    if (document.getElementById('preview-location')) document.getElementById('preview-location').textContent = loc;
    if (document.getElementById('preview-bio')) document.getElementById('preview-bio').textContent = bio;
    if (document.getElementById('preview-position')) document.getElementById('preview-position').textContent = position;
    if (document.getElementById('preview-company')) document.getElementById('preview-company').textContent = company;
    if (document.getElementById('preview-period')) document.getElementById('preview-period').textContent = period;
    if (document.getElementById('preview-school')) document.getElementById('preview-school').textContent = school;
    if (document.getElementById('preview-degree')) document.getElementById('preview-degree').textContent = degree;
    if (document.getElementById('preview-skills')) document.getElementById('preview-skills').textContent = skills;
}

// ==========================================
// 5. OLDAL BETÖLTÉSEKOR
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Ha az állások oldalon vagyunk
    if (document.getElementById('job-container')) {
        await fetchAndRenderJobs();
        
        // Eseményfigyelők a keresőhöz és szűrőkhöz
        document.getElementById('search-keyword')?.addEventListener('input', applyFilters);
        document.getElementById('search-location')?.addEventListener('input', applyFilters);
        document.querySelectorAll('.filter-type, .filter-exp').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });
    }

    // Ha a kedvencek oldalon vagyunk
    if (document.getElementById('favorites-container')) {
        renderFavorites();
    }

    // Ha az önéletrajz oldalon vagyunk
    if (document.getElementById('cv-preview-content')) {
        updatePreview();
        // Az űrlap elemeihez hozzáadjuk az eseményfigyelőt, hogy gépeléskor frissüljön az előnézet
        document.querySelectorAll('.cv-step input, .cv-step textarea').forEach(input => {
            input.addEventListener('input', updatePreview);
        });
    }
});