/**
 * Smart Medical Search — Clinical Technology Controller
 * Communicates strictly with the Python Flask Backend API.
 * Executes Trie (autocomplete), Binary Search (lookup), and KMP (symptoms).
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // DOM Elements — Main Unified Search
  // ==========================================================================
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchForm = document.getElementById('search-form');
  const clearBtn = document.getElementById('clear-btn');
  const dropdown = document.getElementById('autocomplete-dropdown');
  const suggestionsList = document.getElementById('suggestions-list');
  const suggestionCount = document.getElementById('suggestion-count');

  // Search Mode Segment Buttons
  const segmentBtns = document.querySelectorAll('.segment-btn');
  let currentMode = 'smart';

  // Active Algorithm Indicator Cards
  const pillTrie = document.getElementById('pill-trie');
  const pillBs = document.getElementById('pill-bs');
  const pillKmp = document.getElementById('pill-kmp');

  // Main Search State Panels
  const stateInitial = document.getElementById('state-initial');
  const stateLoading = document.getElementById('state-loading');
  const stateDiseaseFound = document.getElementById('state-disease-found');
  const stateSymptomFound = document.getElementById('state-symptom-found');
  const stateNotFound = document.getElementById('state-not-found');
  const stateEmpty = document.getElementById('state-empty');
  const stateError = document.getElementById('state-error');

  // Disease Result Fields
  const resDiseaseId = document.getElementById('res-disease-id');
  const resDiseaseName = document.getElementById('res-disease-name');
  const resAssociatedMed = document.getElementById('res-associated-med');
  const resSymptomsList = document.getElementById('res-symptoms-list');
  const resCausesText = document.getElementById('res-causes-text');
  const resTreatmentText = document.getElementById('res-treatment-text');
  const resPreventionText = document.getElementById('res-prevention-text');

  // Main Search Analysis Card Elements (Right Column)
  const diagAlgo = document.getElementById('diag-algo');
  const diagStatus = document.getElementById('diag-status');
  const diagComps = document.getElementById('diag-comps');
  const diagComplexity = document.getElementById('diag-complexity');

  // Symptom Search Analysis Card Elements (Main Search)
  const kmpKeyword = document.getElementById('kmp-keyword');
  const symptomMatchCount = document.getElementById('symptom-match-count');
  const symptomTotalComps = document.getElementById('symptom-total-comps');
  const symptomCardsGrid = document.getElementById('symptom-cards-grid');

  // ==========================================================================
  // DOM Elements — Dedicated KMP Symptom Search Section
  // ==========================================================================
  const kmpSearchInput = document.getElementById('kmp-search-input');
  const kmpSubmitBtn = document.getElementById('kmp-submit-btn');
  const kmpSearchForm = document.getElementById('kmp-search-form');
  const kmpClearBtn = document.getElementById('kmp-clear-btn');

  const kmpStateInitial = document.getElementById('kmp-state-initial');
  const kmpStateLoading = document.getElementById('kmp-state-loading');
  const kmpStateFound = document.getElementById('kmp-state-found');
  const kmpStateNotFound = document.getElementById('kmp-state-not-found');
  const kmpStateError = document.getElementById('kmp-state-error');
  const kmpNotFoundMsg = document.getElementById('kmp-not-found-msg');

  const kmpActiveKeyword = document.getElementById('kmp-active-keyword');
  const kmpActiveRecords = document.getElementById('kmp-active-records');
  const kmpActiveComps = document.getElementById('kmp-active-comps');
  const kmpCardsGrid = document.getElementById('kmp-cards-grid');

  // Modal Elements
  const detailModal = document.getElementById('detail-modal');
  const modalClose = document.getElementById('modal-close');
  const modalOkBtn = document.getElementById('modal-ok-btn');
  const modalDiseaseName = document.getElementById('modal-disease-name');
  const modalDiseaseId = document.getElementById('modal-disease-id');
  const modalSymptoms = document.getElementById('modal-symptoms');
  const modalCauses = document.getElementById('modal-causes');
  const modalTreatment = document.getElementById('modal-treatment');
  const modalPrevention = document.getElementById('modal-prevention');
  const modalMedicine = document.getElementById('modal-medicine');

  // Dataset Table & Collapsible Elements
  const btnToggleDataset = document.getElementById('btn-toggle-dataset');
  const datasetCollapsible = document.getElementById('dataset-collapsible');
  const datasetTbody = document.getElementById('dataset-tbody');
  const datasetFilter = document.getElementById('dataset-filter');

  let debounceTimer = null;
  let activeSuggestionIndex = -1;
  let currentSuggestions = [];

  // --------------------------------------------------------------------------
  // Static Dataset (for Table Browser reference)
  // --------------------------------------------------------------------------
  const dataset = [
    {sno:1, id:"D1047", name:"Anemia", symptoms:"Fatigue, pale skin, shortness of breath, dizziness", causes:"Iron deficiency, blood loss, chronic disease", treatment:"Iron supplements, dietary changes, blood transfusion", prevention:"Iron-rich diet, treat underlying cause", medicine:"Insulin"},
    {sno:2, id:"D1093", name:"Anxiety Disorder", symptoms:"Excessive worry, restlessness, rapid heartbeat", causes:"Genetics, brain chemistry, stress", treatment:"Therapy, anti-anxiety medication", prevention:"Relaxation techniques, limit caffeine", medicine:"Amlodipine"},
    {sno:3, id:"D1088", name:"Arthritis", symptoms:"Joint pain, stiffness, swelling", causes:"Autoimmune disorder, wear and tear, age", treatment:"NSAIDs, physiotherapy, corticosteroids", prevention:"Regular exercise, healthy weight", medicine:"Ibuprofen"},
    {sno:4, id:"D1033", name:"Asthma", symptoms:"Wheezing, shortness of breath, chest tightness, coughing", causes:"Allergens, air pollution, genetics", treatment:"Inhalers, bronchodilators, corticosteroids", prevention:"Avoid triggers, use air purifiers", medicine:"Insulin"},
    {sno:5, id:"D1012", name:"Bronchitis", symptoms:"Persistent cough, mucus, fatigue, chest discomfort", causes:"Viral infection, smoking, air pollution", treatment:"Rest, fluids, cough suppressants", prevention:"Avoid smoking, air pollution", medicine:"Omeprazole"},
    {sno:6, id:"D1045", name:"Chickenpox", symptoms:"Itchy rash, fever, tiredness, loss of appetite", causes:"Varicella-zoster virus", treatment:"Antihistamines, calamine lotion, rest", prevention:"Varicella vaccine", medicine:"Doxycycline"},
    {sno:7, id:"D1029", name:"Chikungunya", symptoms:"Joint pain, fever, rash, headache", causes:"Chikungunya virus via mosquito bite", treatment:"Pain relievers, rest, fluids", prevention:"Mosquito control, protective clothing", medicine:"Ranitidine"},
    {sno:8, id:"D1091", name:"Chronic Kidney Disease", symptoms:"Swelling in legs, fatigue, poor appetite", causes:"Diabetes, hypertension, prolonged NSAID use", treatment:"Dialysis, kidney transplant, medication", prevention:"Control blood sugar and pressure, hydration", medicine:"Ciprofloxacin"},
    {sno:9, id:"D1102", name:"Common Cold", symptoms:"Runny nose, sore throat, sneezing, cough", causes:"Rhinovirus infection", treatment:"Rest, fluids, decongestants", prevention:"Hand washing, avoid close contact with sick people", medicine:"Diclofenac"},
    {sno:10, id:"D1050", name:"Conjunctivitis", symptoms:"Red eyes, itching, watery discharge", causes:"Viral or bacterial infection, allergens", treatment:"Antibiotic eye drops, cold compress", prevention:"Avoid touching eyes, hand hygiene", medicine:"Not Available"},
    {sno:11, id:"D1006", name:"Dengue Fever", symptoms:"High fever, severe headache, joint pain, rash", causes:"Dengue virus via Aedes mosquito", treatment:"Supportive care, fluids, pain relievers (avoid aspirin)", prevention:"Eliminate stagnant water, mosquito control", medicine:"Metformin"},
    {sno:12, id:"D1027", name:"Depression", symptoms:"Persistent sadness, loss of interest, fatigue", causes:"Chemical imbalance, genetics, life events", treatment:"Counseling, antidepressants, therapy", prevention:"Social support, regular exercise, stress management", medicine:"Azithromycin"},
    {sno:13, id:"D1080", name:"Diabetes Mellitus", symptoms:"Frequent urination, excessive thirst, fatigue, blurred vision", causes:"Insulin resistance, genetic factors, obesity", treatment:"Insulin therapy, metformin, lifestyle changes", prevention:"Healthy diet, regular exercise, weight management", medicine:"Not Available"},
    {sno:14, id:"D1009", name:"Eczema", symptoms:"Itchy, red, dry skin patches", causes:"Allergens, genetics, irritants", treatment:"Moisturizers, corticosteroid creams", prevention:"Avoid irritants, keep skin moisturized", medicine:"Not Available"},
    {sno:15, id:"D1043", name:"Gastroenteritis", symptoms:"Diarrhea, vomiting, abdominal cramps", causes:"Viral or bacterial infection, contaminated food", treatment:"Oral rehydration, rest, antibiotics if bacterial", prevention:"Hand hygiene, safe food handling", medicine:"Aspirin"},
    {sno:16, id:"D1059", name:"Hepatitis B", symptoms:"Fatigue, abdominal pain, jaundice, dark urine", causes:"Hepatitis B virus, blood/body fluid contact", treatment:"Antiviral medication, liver support", prevention:"Vaccination, avoid unsafe needles", medicine:"Not Available"},
    {sno:17, id:"D1053", name:"Hypertension", symptoms:"Headache, dizziness, nosebleeds, shortness of breath", causes:"High salt intake, stress, genetics, obesity", treatment:"ACE inhibitors, beta blockers, diuretics", prevention:"Reduce salt intake, exercise, stress management", medicine:"Not Available"},
    {sno:18, id:"D1075", name:"Influenza", symptoms:"Fever, body ache, cough, fatigue", causes:"Influenza virus", treatment:"Antiviral drugs, rest, fluids", prevention:"Annual flu vaccine, hand hygiene", medicine:"Not Available"},
    {sno:19, id:"D1030", name:"Jaundice", symptoms:"Yellow skin/eyes, dark urine, fatigue", causes:"Liver disease, hepatitis, bile duct obstruction", treatment:"Treat underlying cause, hydration", prevention:"Vaccination against hepatitis, safe food and water", medicine:"Not Available"},
    {sno:20, id:"D1036", name:"Malaria", symptoms:"Fever, chills, sweating, headache, nausea", causes:"Plasmodium parasite via mosquito bite", treatment:"Antimalarial drugs like chloroquine, artemisinin", prevention:"Mosquito nets, insect repellent, antimalarial prophylaxis", medicine:"Not Available"},
    {sno:21, id:"D1010", name:"Measles", symptoms:"Fever, cough, runny nose, red rash", causes:"Measles virus", treatment:"Supportive care, vitamin A", prevention:"MMR vaccination", medicine:"Paracetamol"},
    {sno:22, id:"D1020", name:"Migraine", symptoms:"Severe headache, nausea, sensitivity to light", causes:"Stress, hormonal changes, certain foods", treatment:"Pain relievers, triptans, preventive medication", prevention:"Avoid triggers, regular sleep, stress reduction", medicine:"Not Available"},
    {sno:23, id:"D1041", name:"Obesity", symptoms:"Excess body fat, breathlessness, joint pain", causes:"Overeating, sedentary lifestyle, genetics", treatment:"Diet control, exercise, bariatric surgery", prevention:"Balanced diet, physical activity", medicine:"Losartan"},
    {sno:24, id:"D1022", name:"Osteoporosis", symptoms:"Bone fragility, fractures, back pain", causes:"Aging, calcium deficiency, hormonal changes", treatment:"Calcium/vitamin D supplements, medication", prevention:"Weight-bearing exercise, calcium-rich diet", medicine:"Insulin"},
    {sno:25, id:"D1092", name:"Peptic Ulcer", symptoms:"Abdominal pain, bloating, nausea", causes:"H. pylori infection, NSAID overuse", treatment:"Antibiotics, proton pump inhibitors", prevention:"Avoid NSAIDs, limit alcohol and smoking", medicine:"Doxycycline"},
    {sno:26, id:"D1054", name:"Pneumonia", symptoms:"Cough with phlegm, fever, chest pain, difficulty breathing", causes:"Bacterial or viral infection of lungs", treatment:"Antibiotics, oxygen therapy, rest", prevention:"Vaccination, avoid smoking", medicine:"Diclofenac"},
    {sno:27, id:"D1104", name:"Psoriasis", symptoms:"Red patches with silvery scales, itching", causes:"Autoimmune condition, genetics", treatment:"Topical treatments, phototherapy", prevention:"Avoid triggers like stress, skin injury", medicine:"Aspirin"},
    {sno:28, id:"D1002", name:"Tuberculosis", symptoms:"Persistent cough, weight loss, night sweats, fever", causes:"Mycobacterium tuberculosis bacteria", treatment:"Antibiotics (isoniazid, rifampicin) for 6 months", prevention:"BCG vaccination, avoid close contact with patients", medicine:"Doxycycline"},
    {sno:29, id:"D1044", name:"Typhoid Fever", symptoms:"Prolonged fever, weakness, stomach pain, headache", causes:"Salmonella typhi bacteria, contaminated food/water", treatment:"Antibiotics like ciprofloxacin, azithromycin", prevention:"Safe drinking water, vaccination, hygiene", medicine:"Ibuprofen"},
    {sno:30, id:"D1007", name:"Urinary Tract Infection", symptoms:"Burning urination, frequent urge to urinate, cloudy urine", causes:"Bacterial infection of urinary tract", treatment:"Antibiotics, increased fluid intake", prevention:"Good hygiene, drink plenty of water", medicine:"Ciprofloxacin"}
  ];

  function renderDatasetTable(items) {
    if (!datasetTbody) return;
    datasetTbody.innerHTML = '';
    items.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="code-tag">${row.id}</span></td>
        <td><strong>${escapeHTML(row.name)}</strong></td>
        <td>${escapeHTML(row.symptoms)}</td>
        <td>${escapeHTML(row.causes)}</td>
        <td>${escapeHTML(row.treatment)}</td>
        <td>${escapeHTML(row.prevention)}</td>
        <td><strong>${escapeHTML(row.medicine)}</strong></td>
        <td>
          <button type="button" class="btn-table-search" data-name="${escapeHTML(row.name)}">Search →</button>
        </td>
      `;
      datasetTbody.appendChild(tr);
    });

    datasetTbody.querySelectorAll('.btn-table-search').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        searchInput.value = name;
        setSearchMode('disease');
        executeSearch(name, 'disease');
        window.scrollTo({ top: document.getElementById('search-section').offsetTop - 60, behavior: 'smooth' });
      });
    });
  }

  renderDatasetTable(dataset);

  if (datasetFilter) {
    datasetFilter.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = dataset.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.id.toLowerCase().includes(q) || 
        r.symptoms.toLowerCase().includes(q) || 
        r.causes.toLowerCase().includes(q) ||
        r.medicine.toLowerCase().includes(q)
      );
      renderDatasetTable(filtered);
    });
  }

  // Collapsible Dataset Table
  if (btnToggleDataset) {
    btnToggleDataset.addEventListener('click', () => {
      const isExpanded = btnToggleDataset.getAttribute('aria-expanded') === 'true';
      btnToggleDataset.setAttribute('aria-expanded', !isExpanded);
      btnToggleDataset.classList.toggle('open', !isExpanded);
      datasetCollapsible.style.display = isExpanded ? 'none' : 'block';
    });
  }

  // --------------------------------------------------------------------------
  // Active Algorithm Indicator Visualization
  // --------------------------------------------------------------------------
  function setActiveAlgorithm(algo) {
    pillTrie.classList.remove('active-state');
    pillBs.classList.remove('active-state');
    pillKmp.classList.remove('active-state');

    if (algo === 'trie') {
      pillTrie.classList.add('active-state');
    } else if (algo === 'binary_search') {
      pillBs.classList.add('active-state');
    } else if (algo === 'kmp') {
      pillKmp.classList.add('active-state');
    }
  }

  // --------------------------------------------------------------------------
  // Search Mode Segmented Control (Main Search)
  // --------------------------------------------------------------------------
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentMode = btn.getAttribute('data-mode');
    });
  });

  function setSearchMode(mode) {
    currentMode = mode;
    segmentBtns.forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Main Search State Management
  // --------------------------------------------------------------------------
  function hideAllStates() {
    stateInitial.style.display = 'none';
    stateLoading.style.display = 'none';
    stateDiseaseFound.style.display = 'none';
    stateSymptomFound.style.display = 'none';
    stateNotFound.style.display = 'none';
    stateEmpty.style.display = 'none';
    stateError.style.display = 'none';
  }

  function showState(element) {
    hideAllStates();
    if (element) {
      element.style.display = 'block';
    }
  }

  // --------------------------------------------------------------------------
  // Trie Autocomplete Interaction
  // --------------------------------------------------------------------------
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearBtn.style.display = val.length > 0 ? 'flex' : 'none';

    clearTimeout(debounceTimer);
    if (!val.trim()) {
      closeDropdown();
      setActiveAlgorithm(null);
      return;
    }

    debounceTimer = setTimeout(() => {
      fetchTrieSuggestions(val.trim());
    }, 120);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    closeDropdown();
    showState(stateInitial);
    setActiveAlgorithm(null);
    searchInput.focus();
  });

  async function fetchTrieSuggestions(prefix) {
    try {
      setActiveAlgorithm('trie');
      const res = await fetch(`/api/autocomplete?prefix=${encodeURIComponent(prefix)}`);
      if (!res.ok) return;
      const data = await res.json();
      currentSuggestions = data.suggestions || [];
      renderDropdown(currentSuggestions, prefix);
    } catch (err) {
      console.error('Trie autocomplete error:', err);
    }
  }

  function renderDropdown(suggestions, prefix) {
    if (!suggestions || suggestions.length === 0) {
      closeDropdown();
      return;
    }

    suggestionsList.innerHTML = '';
    suggestionCount.textContent = `${suggestions.length} found`;
    activeSuggestionIndex = -1;

    suggestions.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item-row';
      li.setAttribute('role', 'option');
      li.setAttribute('data-index', index);

      const lowerItem = item.toLowerCase();
      const lowerPrefix = prefix.toLowerCase();
      let displayHTML = escapeHTML(item);

      if (lowerItem.startsWith(lowerPrefix)) {
        const matchPart = item.substring(0, prefix.length);
        const restPart = item.substring(prefix.length);
        displayHTML = `<strong>${escapeHTML(matchPart)}</strong>${escapeHTML(restPart)}`;
      }

      li.innerHTML = `
        <div class="suggestion-item-left">
          <span class="sugg-icon">🩺</span>
          <span class="sugg-text">${displayHTML}</span>
        </div>
        <span class="sugg-tag">Disease</span>
      `;

      li.addEventListener('click', () => {
        selectSuggestion(item);
      });

      suggestionsList.appendChild(li);
    });

    dropdown.style.display = 'block';
  }

  function closeDropdown() {
    dropdown.style.display = 'none';
    activeSuggestionIndex = -1;
  }

  function selectSuggestion(diseaseName) {
    searchInput.value = diseaseName;
    closeDropdown();
    setSearchMode('disease');
    executeDiseaseSearch(diseaseName);
  }

  // Keyboard navigation inside Autocomplete dropdown
  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsList.querySelectorAll('.suggestion-item-row');
    if (dropdown.style.display === 'block' && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        highlightSuggestion(items);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        highlightSuggestion(items);
        return;
      } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < currentSuggestions.length) {
          e.preventDefault();
          selectSuggestion(currentSuggestions[activeSuggestionIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        closeDropdown();
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      closeDropdown();
      triggerMainSearch();
    }
  });

  function highlightSuggestion(items) {
    items.forEach((item, idx) => {
      if (idx === activeSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!searchForm.contains(e.target)) {
      closeDropdown();
    }
  });

  // --------------------------------------------------------------------------
  // Main Search Execution
  // --------------------------------------------------------------------------
  searchBtn.addEventListener('click', () => {
    closeDropdown();
    triggerMainSearch();
  });

  function triggerMainSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      showState(stateEmpty);
      return;
    }
    executeSearch(query, currentMode);
  }

  function executeSearch(query, mode) {
    if (mode === 'disease') {
      executeDiseaseSearch(query);
    } else if (mode === 'symptom') {
      executeSymptomSearch(query);
    } else {
      executeSmartSearch(query);
    }
  }

  // Exact Disease Search (Binary Search in Python)
  async function executeDiseaseSearch(query) {
    showState(stateLoading);
    setActiveAlgorithm('binary_search');

    try {
      const res = await fetch(`/api/search/disease?query=${encodeURIComponent(query)}`);
      if (!res.ok && res.status !== 400) throw new Error('Server error');
      const data = await res.json();

      if (data.found && data.disease) {
        renderDiseaseCard(data.disease, data.comparisons, 'Binary Search');
      } else {
        showState(stateNotFound);
      }
    } catch (err) {
      console.error('Binary search error:', err);
      showState(stateError);
    }
  }

  // Symptom Search (KMP Algorithm in Python)
  async function executeSymptomSearch(query) {
    showState(stateLoading);
    setActiveAlgorithm('kmp');

    try {
      const res = await fetch(`/api/search/symptom?query=${encodeURIComponent(query)}`);
      if (!res.ok && res.status !== 400) throw new Error('Server error');
      const data = await res.json();

      if (data.found && data.results && data.results.length > 0) {
        renderSymptomResults(data.keyword, data.results, data.matching_records, data.total_comparisons);
      } else {
        showState(stateNotFound);
      }
    } catch (err) {
      console.error('KMP search error:', err);
      showState(stateError);
    }
  }

  // Smart Unified Search
  async function executeSmartSearch(query) {
    showState(stateLoading);

    try {
      const res = await fetch(`/api/search/smart?query=${encodeURIComponent(query)}`);
      if (!res.ok && res.status !== 400) throw new Error('Server error');
      const data = await res.json();

      if (data.found) {
        if (data.search_type === 'disease') {
          setActiveAlgorithm('binary_search');
          renderDiseaseCard(data.disease, data.comparisons, 'Binary Search');
        } else if (data.search_type === 'symptom') {
          setActiveAlgorithm('kmp');
          renderSymptomResults(data.keyword, data.results, data.matching_records, data.total_comparisons);
        }
      } else {
        setActiveAlgorithm(null);
        showState(stateNotFound);
      }
    } catch (err) {
      console.error('Smart search error:', err);
      showState(stateError);
    }
  }

  // --------------------------------------------------------------------------
  // Main Search Rendering Helpers
  // --------------------------------------------------------------------------
  function renderDiseaseCard(disease, comparisons, algoLabel) {
    diagAlgo.textContent = algoLabel || 'Binary Search';
    diagStatus.textContent = '✓ Found';
    diagComplexity.textContent = 'O(log n)';
    diagComps.textContent = comparisons;

    resDiseaseId.textContent = disease["Disease_ID"];
    resDiseaseName.textContent = disease["Disease Name"];
    resAssociatedMed.textContent = disease["Associated_Medicine"] || "Not Available";

    resSymptomsList.innerHTML = '';
    const symptomsArr = (disease["Symptoms"] || '').split(',').map(s => s.trim()).filter(Boolean);
    symptomsArr.forEach(s => {
      const chip = document.createElement('span');
      chip.className = 'symptom-chip';
      chip.textContent = s;
      resSymptomsList.appendChild(chip);
    });

    resCausesText.textContent = disease["Causes"] || 'Not Available';
    resTreatmentText.textContent = disease["Treatment"] || 'Not Available';
    resPreventionText.textContent = disease["Prevention"] || 'Not Available';

    showState(stateDiseaseFound);
  }

  function renderSymptomResults(keyword, results, matchCount, totalComps) {
    if (kmpKeyword) kmpKeyword.textContent = keyword;
    symptomMatchCount.textContent = matchCount;
    symptomTotalComps.textContent = totalComps;

    symptomCardsGrid.innerHTML = '';

    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'symptom-condition-card';

      const highlightedSymptoms = highlightKeyword(item["Symptoms"], keyword);

      card.innerHTML = `
        <div>
          <div class="symptom-card-top">
            <div>
              <h4 class="symptom-disease-name">${escapeHTML(item["Disease Name"])}</h4>
              <span class="symptom-id-code">${escapeHTML(item["Disease_ID"])}</span>
            </div>
            <span class="symptom-comps-badge">${item.comparisons} comps</span>
          </div>
          <p class="symptom-text-preview">${highlightedSymptoms}</p>
        </div>
        <button type="button" class="btn-card-view-details" data-id="${item.Disease_ID}">View Details →</button>
      `;

      card.querySelector('.btn-card-view-details').addEventListener('click', () => {
        openDetailModal(item);
      });

      symptomCardsGrid.appendChild(card);
    });

    showState(stateSymptomFound);
  }

  // ==========================================================================
  // DEDICATED KMP SECTION LOGIC
  // ==========================================================================
  function hideAllKmpStates() {
    kmpStateInitial.style.display = 'none';
    kmpStateLoading.style.display = 'none';
    kmpStateFound.style.display = 'none';
    kmpStateNotFound.style.display = 'none';
    kmpStateError.style.display = 'none';
  }

  function showKmpState(element) {
    hideAllKmpStates();
    if (element) {
      element.style.display = element === kmpStateFound ? 'block' : 'block';
    }
  }

  if (kmpSearchInput) {
    kmpSearchInput.addEventListener('input', (e) => {
      kmpClearBtn.style.display = e.target.value.length > 0 ? 'inline-block' : 'none';
    });
  }

  if (kmpClearBtn) {
    kmpClearBtn.addEventListener('click', () => {
      kmpSearchInput.value = '';
      kmpClearBtn.style.display = 'none';
      showKmpState(kmpStateInitial);
      setActiveAlgorithm(null);
      kmpSearchInput.focus();
    });
  }

  if (kmpSubmitBtn) {
    kmpSubmitBtn.addEventListener('click', () => {
      triggerDedicatedKmpSearch();
    });
  }

  function triggerDedicatedKmpSearch() {
    const keyword = kmpSearchInput.value.trim();
    if (!keyword) {
      showKmpState(kmpStateInitial);
      return;
    }
    executeDedicatedKmp(keyword);
  }

  async function executeDedicatedKmp(keyword) {
    showKmpState(kmpStateLoading);
    setActiveAlgorithm('kmp');

    try {
      const res = await fetch(`/api/search/symptom?query=${encodeURIComponent(keyword)}`);
      if (!res.ok && res.status !== 400) throw new Error('Server error');
      const data = await res.json();

      if (data.found && data.results && data.results.length > 0) {
        renderDedicatedKmpResults(data.keyword, data.results, data.matching_records, data.total_comparisons);
      } else {
        if (kmpNotFoundMsg) {
          kmpNotFoundMsg.innerHTML = `We couldn't find any disease containing: "<strong>${escapeHTML(keyword)}</strong>". Try another symptom or keyword.`;
        }
        showKmpState(kmpStateNotFound);
      }
    } catch (err) {
      console.error('Dedicated KMP Search error:', err);
      showKmpState(kmpStateError);
    }
  }

  function renderDedicatedKmpResults(keyword, results, matchCount, totalComps) {
    kmpActiveKeyword.textContent = keyword;
    kmpActiveRecords.textContent = matchCount;
    kmpActiveComps.textContent = totalComps;

    kmpCardsGrid.innerHTML = '';

    results.forEach(disease => {
      const card = document.createElement('div');
      card.className = 'kmp-medical-card';

      const highlightedSymptoms = highlightKeyword(disease["Symptoms"], keyword);

      card.innerHTML = `
        <div>
          <div class="kmp-card-header">
            <div>
              <h4 class="kmp-card-disease-title">🩺 ${escapeHTML(disease["Disease Name"])}</h4>
              <span class="kmp-card-id-badge">Disease ID: ${escapeHTML(disease["Disease_ID"])}</span>
            </div>
            <span class="kmp-card-comps-tag">${disease.comparisons} comps</span>
          </div>

          <div class="kmp-card-sections">
            <div class="kmp-section-row">
              <span class="kmp-section-label">🩹 SYMPTOMS</span>
              <p>${highlightedSymptoms}</p>
            </div>

            <div class="kmp-section-row">
              <span class="kmp-section-label">⚠️ CAUSES</span>
              <p>${escapeHTML(disease["Causes"] || 'Not Available')}</p>
            </div>

            <div class="kmp-section-row">
              <span class="kmp-section-label">💊 TREATMENT</span>
              <p>${escapeHTML(disease["Treatment"] || 'Not Available')}</p>
            </div>

            <div class="kmp-section-row">
              <span class="kmp-section-label">🛡️ PREVENTION</span>
              <p>${escapeHTML(disease["Prevention"] || 'Not Available')}</p>
            </div>

            <div class="kmp-section-row">
              <span class="kmp-section-label">💉 ASSOCIATED MEDICINE</span>
              <p><strong>${escapeHTML(disease["Associated_Medicine"] || 'Not Available')}</strong></p>
            </div>
          </div>
        </div>

        <button type="button" class="btn-kmp-view-details" data-id="${disease.Disease_ID}">[ VIEW DETAILS ]</button>
      `;

      card.querySelector('.btn-kmp-view-details').addEventListener('click', () => {
        openDetailModal(disease);
      });

      kmpCardsGrid.appendChild(card);
    });

    showKmpState(kmpStateFound);
  }

  // KMP Quick Pills click listeners
  document.querySelectorAll('.kmp-chip, .kmp-chip-link').forEach(pill => {
    pill.addEventListener('click', () => {
      const sym = pill.getAttribute('data-symptom');
      if (kmpSearchInput) {
        kmpSearchInput.value = sym;
        kmpClearBtn.style.display = 'inline-block';
        executeDedicatedKmp(sym);
      }
    });
  });

  // Highlight helper: replaces matched keyword with <mark class="kmp-highlight">
  function highlightKeyword(text, keyword) {
    if (!text || !keyword) return escapeHTML(text);
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    return escapeHTML(text).replace(regex, '<mark class="kmp-highlight">$1</mark>');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // Detail Modal Actions
  // --------------------------------------------------------------------------
  function openDetailModal(item) {
    modalDiseaseName.textContent = item["Disease Name"];
    modalDiseaseId.textContent = item["Disease_ID"];
    modalSymptoms.textContent = item["Symptoms"];
    modalCauses.textContent = item["Causes"];
    modalTreatment.textContent = item["Treatment"];
    modalPrevention.textContent = item["Prevention"];
    modalMedicine.textContent = item["Associated_Medicine"] || "Not Available";
    detailModal.style.display = 'flex';
  }

  function closeDetailModal() {
    detailModal.style.display = 'none';
  }

  if (modalClose) modalClose.addEventListener('click', closeDetailModal);
  if (modalOkBtn) modalOkBtn.addEventListener('click', closeDetailModal);
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
  }

  // Not Found fallbacks
  const btnClearSearchView = document.getElementById('btn-clear-search-view');
  const btnTrySymptom = document.getElementById('btn-try-symptom');

  if (btnClearSearchView) {
    btnClearSearchView.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      showState(stateInitial);
      setActiveAlgorithm(null);
      searchInput.focus();
    });
  }

  if (btnTrySymptom) {
    btnTrySymptom.addEventListener('click', () => {
      const q = searchInput.value.trim();
      setSearchMode('symptom');
      if (q) executeSymptomSearch(q);
    });
  }

  // Popular Queries Chips in Main Search
  document.querySelectorAll('.query-chip, .hint-link').forEach(pill => {
    pill.addEventListener('click', () => {
      const query = pill.getAttribute('data-query');
      const mode = pill.getAttribute('data-mode') || 'smart';
      searchInput.value = query;
      clearBtn.style.display = 'flex';
      setSearchMode(mode);
      executeSearch(query, mode);
    });
  });

});
