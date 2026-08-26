/**
 * app.js - Lógica Interativa Principal da Landing Page Executiva
 * Estudo de Viabilidade Térmica & Energética - Novo Shopping
 * 3D Ar Condicionado & Automação
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initCharts();
  initCalculator();
  initSimulator();
  initCatalog();
  initRoadmapAndFaq();
  initExecutiveExport();
  animateHeroCounters();
}

/**
 * Animação de Contadores Numéricos no Hero
 */
function animateHeroCounters() {
  const animatedElements = document.querySelectorAll('.animate-count');
  animatedElements.forEach(el => {
    const target = parseFloat(el.getAttribute('data-target'));
    const isCurrency = el.getAttribute('data-currency') === 'true';
    const isDecimal = el.getAttribute('data-decimal') === 'true';
    const duration = 1600;
    const start = 0;
    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      const currentVal = start + (target - start) * easeProgress;

      if (isCurrency) {
        el.innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentVal);
      } else if (isDecimal) {
        el.innerText = currentVal.toFixed(1).replace('.', ',');
      } else {
        el.innerText = Math.round(currentVal).toLocaleString('pt-BR');
      }

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    }
    requestAnimationFrame(updateCount);
  });
}

/**
 * ==========================================================================
 * CALCULADORA DINÂMICA DE VIABILIDADE FINANCEIRA & TÉCNICA
 * ==========================================================================
 */
// Firebase Init
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp({
      apiKey: "AIzaSyB5W7i5Ml71o8Cpva81OSIIyuN1lIvEHyg",
      authDomain: "analiseenergeticanovoshopping.firebaseapp.com",
      projectId: "analiseenergeticanovoshopping",
      storageBucket: "analiseenergeticanovoshopping.firebasestorage.app",
      messagingSenderId: "1075085728649",
      appId: "1:1075085728649:web:03918608f7363f045d5f58",
    });
    window.db = firebase.firestore();
  }
} catch(e) {
  console.log('Firebase already initialized or skipped:', e.message);
}

let autoSaveTimeout = null;
function autoSaveConfigToFirebase(data) {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(async () => {
    if (window.db) {
      try {
        await window.db.collection('config').doc('parametros').set(data, { merge: true });
        console.log('Parâmetros salvos no Firebase com sucesso!');
      } catch(err) {
        console.error('Erro ao salvar no Firebase:', err);
      }
    }
  }, 600);
}

// Help Modals Data
const helpData = {
  equipamento: { title: "Equipamento (TAG)", description: "TAG identificadora do climatizador monitorado pelo CLP." },
  evaps: { title: "Quantidade de Evaporadoras (UE)", description: "Número de unidades evaporadoras ligadas ao circuito térmico (1 ou 2 UEs)." },
  tempo_setpoint: { title: "Tempo para Atingir o Setpoint (Pull-down)", description: "<b>O que significa:</b> Tempo médio decorrido para resfriar o ambiente até a meta programada.<br><br><b>Como é calculado:</b> Intervalo desde a primeira partida dos compressores (ON) até o momento em que ambos desligam pela primeira vez (OFF-OFF)." },
  dc_master: { title: "Duty Cycle Mestre", description: "<b>O que significa:</b> Percentual de tempo da jornada de 12h em que a unidade condensadora Mestre permaneceu ligada.<br><br><b>Cálculo:</b> <code>(Minutos Ligada / 720 min) × 100</code>." },
  dc_slave: { title: "Duty Cycle Escrava", description: "<b>O que significa:</b> Percentual de tempo da jornada de 12h em que a unidade condensadora Escrava permaneceu ligada.<br><br><b>Cálculo:</b> <code>(Minutos Ligada / 720 min) × 100</code>." },
  both_on: { title: "Tempo Ambos ON", description: "<b>O que significa:</b> Tempo médio diário em que ambos os compressores operaram simultaneamente sob carga máxima." },
  dc_global: { title: "Duty Cycle Global", description: "<b>O que significa:</b> Média ponderada do ciclo de trabalho de ambas as condensadoras: <code>(Duty Mestre + Duty Escrava) / 2</code>." },
  temp_setpoint: { title: "Temperatura Média / Setpoint", description: "<b>O que significa:</b> Relação entre a temperatura média mantida na sala durante a jornada de 12h e a meta desejada." },
  revezamento: { title: "Revezamento de Compressores", description: "<b>O que significa:</b> Confirmação de que o rodízio automático a cada 12 horas está alternando o compressor líder para equalizar o desgaste mecânico." }
};

function openHelpModal(metric) {
  const info = helpData[metric];
  if (!info) return;
  const overlay = document.getElementById('equipModalOverlay');
  const modalTag = document.getElementById('modalTag');
  const modalBody = document.getElementById('modalBody');
  
  modalTag.innerText = `💡 ${info.title}`;
  modalBody.innerHTML = `
    <div style="font-size: 0.95rem; line-height: 1.7; color: var(--text-main);">
      ${info.description}
    </div>
  `;
  overlay.classList.add('active');
}

function initCalculator() {
  const tariffSlider = document.getElementById('calcTariffSlider');
  const hoursSlider = document.getElementById('calcHoursSlider');
  const machinesSlider = document.getElementById('calcMachinesSlider');
  const capexSlider = document.getElementById('calcCapexSlider');

  const tariffBadge = document.getElementById('calcTariffVal');
  const hoursBadge = document.getElementById('calcHoursVal');
  const machinesBadge = document.getElementById('calcMachinesVal');
  const capexBadge = document.getElementById('calcCapexVal');

  if (!tariffSlider || !hoursSlider || !machinesSlider || !capexSlider) return;

  function recalculate() {
    const tariff = parseFloat(tariffSlider.value);
    const dailyHours = parseFloat(hoursSlider.value);
    const machinesCount = parseInt(machinesSlider.value, 10);
    const capex = parseFloat(capexSlider.value);

    // Update badges
    tariffBadge.innerText = `R$ ${tariff.toFixed(2).replace('.', ',')} / kWh`;
    hoursBadge.innerText = `${dailyHours} horas/dia`;
    machinesBadge.innerText = `${machinesCount} climatizadores`;
    capexBadge.innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(capex);

    // Mathematical Calculation based on engineering parameters
    const setupHours = 1.5;
    const maintHours = Math.max(0, dailyHours - setupHours);
    const daysMonth = 30;
    const daysYear = 365;

    const dutyBefore = 0.70;
    const dutyAfterM = 0.70;
    const dutySlaveSlider = document.getElementById('calcDutySlaveSlider');
    const dutySlaveBadge = document.getElementById('calcDutySlaveVal');
    const dutyAfterS = dutySlaveSlider ? parseFloat(dutySlaveSlider.value) : 0.50;
    if (dutySlaveBadge) {
      dutySlaveBadge.innerText = `${Math.round(dutyAfterS * 100)}% (${dutyAfterS.toFixed(2).replace('.', ',')})`;
    }

    // Unit Power Reference (Average 2 UCs 10kW + avg UE 2.2kW)
    const ucPowerUnit = 10.0;
    const ucsPower = 2 * ucPowerUnit; // 20 kW
    const avgUePower = 2.2; // kW média ponderada

    // Baseline calculations per machine:
    // Before: Setup (22.2 kW * 1.5h) + Maint (2.2 + 20*0.7) * maintHours
    const dailyKwhBeforeUnit = (ucsPower + avgUePower) * setupHours + (avgUePower + (ucsPower * dutyBefore)) * maintHours;
    // After: Setup (22.2 kW * 1.5h) + Maint (2.2 + 10*0.7 + 10*0.5) * maintHours
    const dailyKwhAfterUnit = (ucsPower + avgUePower) * setupHours + (avgUePower + (ucPowerUnit * dutyAfterM) + (ucPowerUnit * dutyAfterS)) * maintHours;

    const monthlyKwhSavingsUnit = (dailyKwhBeforeUnit - dailyKwhAfterUnit) * daysMonth;
    const totalMonthlyKwhSavings = monthlyKwhSavingsUnit * machinesCount;
    const totalAnnualKwhSavings = totalMonthlyKwhSavings * 12;

    const monthlySavingsReais = totalMonthlyKwhSavings * tariff;
    const annualSavingsReais = totalAnnualKwhSavings * tariff;

    // Totals consumption for charts
    const totalMonthlyKwhBefore = dailyKwhBeforeUnit * daysMonth * machinesCount;
    const totalMonthlyKwhAfter = dailyKwhAfterUnit * daysMonth * machinesCount;
    const totalMonthlyCostBefore = totalMonthlyKwhBefore * tariff;
    const totalMonthlyCostAfter = totalMonthlyKwhAfter * tariff;

    // Financial Metrics
    const paybackMonths = annualSavingsReais > 0 ? (capex / annualSavingsReais) * 12 : 0;
    const roi5Years = capex > 0 ? (((annualSavingsReais * 5) - capex) / capex) * 100 : 0;

    // VPL 5 Years @ TMA 12% a.a.
    const tma = 0.12;
    let vplAccum = -capex;
    for (let t = 1; t <= 5; t++) {
      vplAccum += annualSavingsReais / Math.pow(1 + tma, t);
    }

    // CO2 Reduction (tCO2/year)
    const co2Tons = (totalAnnualKwhSavings * 0.086) / 1000;

    // Update Result UI Elements
    document.getElementById('calcResAnnualSavings').innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualSavingsReais);
    document.getElementById('calcResMonthlySavings').innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlySavingsReais);
    document.getElementById('calcResPayback').innerText = `${paybackMonths.toFixed(1).replace('.', ',')} meses`;
    document.getElementById('calcResRoi').innerText = `+${roi5Years.toFixed(1).replace('.', ',')}%`;
    document.getElementById('calcResVpl').innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(vplAccum);
    document.getElementById('calcResCo2').innerText = `${co2Tons.toFixed(1).replace('.', ',')} tCO₂/ano`;
    document.getElementById('calcResKwhSavings').innerText = `${Math.round(totalAnnualKwhSavings).toLocaleString('pt-BR')} kWh/ano`;

    // Dynamic Chart Update
    updateDynamicCharts(capex, annualSavingsReais, totalMonthlyKwhBefore, totalMonthlyKwhAfter, totalMonthlyCostBefore, totalMonthlyCostAfter);
    autoSaveConfigToFirebase({
      tarifa: tariff,
      horasDiarias: dailyHours,
      maquinas: machinesCount,
      capex: capex,
      dcEscrava: dutyAfterS
    });
  }

  tariffSlider.addEventListener('input', recalculate);
  hoursSlider.addEventListener('input', recalculate);
  machinesSlider.addEventListener('input', recalculate);
  capexSlider.addEventListener('input', recalculate);
  const dutySlaveSlider = document.getElementById('calcDutySlaveSlider');
  if (dutySlaveSlider) {
    dutySlaveSlider.addEventListener('input', recalculate);
  }

  // Initial Calculation
  recalculate();
}

/**
 * ==========================================================================
 * SIMULADOR INTERATIVO ANTES VS. DEPOIS (CLP) & REDUNDÂNCIA
 * ==========================================================================
 */
let simState = {
  mode: 'clp', // 'before' | 'clp'
  tempSetpoint: 22,
  currentHour: 8,
  faultMaster: false
};

function initSimulator() {
  const btnBefore = document.getElementById('simBtnBefore');
  const btnClp = document.getElementById('simBtnClp');
  const tempSlider = document.getElementById('simTempSlider');
  const tempVal = document.getElementById('simTempVal');
  const timeSlider = document.getElementById('simTimeSlider');
  const timeVal = document.getElementById('simTimeVal');
  const faultBtn = document.getElementById('simFaultBtn');

  if (!btnBefore || !btnClp) return;

  btnBefore.addEventListener('click', () => {
    simState.mode = 'before';
    simState.faultMaster = false;
    btnBefore.classList.add('active-before');
    btnClp.classList.remove('active-after');
    updateSimView();
  });

  btnClp.addEventListener('click', () => {
    simState.mode = 'clp';
    btnClp.classList.add('active-after');
    btnBefore.classList.remove('active-before');
    updateSimView();
  });

  tempSlider.addEventListener('input', (e) => {
    simState.tempSetpoint = parseFloat(e.target.value);
    tempVal.innerText = `${simState.tempSetpoint} °C`;
    updateSimView();
  });

  timeSlider.addEventListener('input', (e) => {
    simState.currentHour = parseInt(e.target.value, 10);
    timeVal.innerText = `${simState.currentHour.toString().padStart(2, '0')}:00h (${simState.currentHour >= 12 ? '2º Turno' : '1º Turno'})`;
    updateSimView();
  });

  faultBtn.addEventListener('click', () => {
    if (simState.mode !== 'clp') {
      alert('Selecione o Cenário Modernizado (CLP) para testar a redundância automática.');
      return;
    }
    simState.faultMaster = !simState.faultMaster;
    faultBtn.innerText = simState.faultMaster ? '⚠️ Restaurar UC Mestre' : '🚨 Simular Falha na UC Mestre';
    faultBtn.className = simState.faultMaster ? 'btn btn-sm btn-emerald' : 'btn btn-sm btn-outline';
    updateSimView();
  });

  updateSimView();
}

function updateSimView() {
  const ucA = document.getElementById('simUcA');
  const ucB = document.getElementById('simUcB');
  const ueUnit = document.getElementById('simUe');
  const simExplanation = document.getElementById('simExplanation');
  const simStatusBadge = document.getElementById('simStatusBadge');

  if (!ucA || !ucB || !ueUnit) return;

  // Reset classes
  ucA.className = 'hvac-unit-block';
  ucB.className = 'hvac-unit-block';
  ueUnit.className = 'hvac-unit-block';

  if (simState.mode === 'before') {
    // Modo Analógico: Ambas UCs ligadas sem rodízio, com acionamento síncrono
    ucA.classList.add('active-master');
    ucB.classList.add('active-master');
    ueUnit.classList.add('active-master');

    document.getElementById('statusUcA').innerHTML = '<span class="status-chip chip-active">Ligado 100% (Analógico)</span>';
    document.getElementById('dutyUcA').innerText = 'Duty Cycle: 70% (Manutenção síncrona)';

    document.getElementById('statusUcB').innerHTML = '<span class="status-chip chip-active">Ligado 100% (Analógico)</span>';
    document.getElementById('dutyUcB').innerText = 'Duty Cycle: 70% (Manutenção síncrona)';

    document.getElementById('statusUe').innerHTML = '<span class="status-chip chip-active">Em Operação</span>';
    document.getElementById('dutyUe').innerText = 'Vazão Contínua (Sem CLP)';

    simStatusBadge.innerHTML = '<span class="status-chip chip-fault">🔴 Sistema Analógico (Alto Desgaste)</span>';
    simExplanation.innerHTML = `
      <strong>Comportamento Térmico Analógico:</strong> Ambas as condensadoras (UC-A e UC-B) entram em operação simultânea via termostato mecânico. 
      Isso gera <em>picos de partida de corrente</em>, desgaste síncrono sem rodízio e desperdício de <strong>24.187 kWh/mês</strong> em energia.
    `;
  } else {
    // Modo Modernizado com CLP
    if (simState.faultMaster) {
      // Falha na Mestre -> Escrava assume 100%
      ucA.classList.add('fault');
      ucB.classList.add('active-master');
      ueUnit.classList.add('active-slave');

      document.getElementById('statusUcA').innerHTML = '<span class="status-chip chip-fault">⚠️ FALHA DETECTADA</span>';
      document.getElementById('dutyUcA').innerText = 'Desarme térmico / Sobrecarga';

      document.getElementById('statusUcB').innerHTML = '<span class="status-chip chip-active">REDUNDÂNCIA ATIVA (100%)</span>';
      document.getElementById('dutyUcB').innerText = 'Assumiu a carga automaticamente';

      document.getElementById('statusUe').innerHTML = '<span class="status-chip chip-active">Normal (Estável)</span>';
      document.getElementById('dutyUe').innerText = 'Ambiente mantido em 22°C';

      simStatusBadge.innerHTML = '<span class="status-chip chip-partial">⚡ Redundância Ativa (Segurança)</span>';
      simExplanation.innerHTML = `
        <strong>Ação Automática do CLP:</strong> O CLP identificou a falha na UC-A e acionou imediatamente a UC-B como substituta sem interrupção térmica no mall. A equipe técnica é notificada via telemetria.
      `;
    } else {
      // Funcionamento Normal com Rodízio 12h
      const isFirstTurn = simState.currentHour < 12;
      const masterName = isFirstTurn ? 'UC-A (Mestre)' : 'UC-B (Mestre)';
      const slaveName = isFirstTurn ? 'UC-B (Escrava)' : 'UC-A (Escrava)';

      if (isFirstTurn) {
        ucA.classList.add('active-master');
        ucB.classList.add('active-slave');

        document.getElementById('statusUcA').innerHTML = '<span class="status-chip chip-active">MESTRE (Prioridade)</span>';
        document.getElementById('dutyUcA').innerText = 'Duty Cycle: 70% (Estágio 1 Principal)';

        document.getElementById('statusUcB').innerHTML = '<span class="status-chip chip-partial">ESCRAVA (Modulada)</span>';
        document.getElementById('dutyUcB').innerText = 'Duty Cycle: 50% (Estágio 2 Suporte)';
      } else {
        ucB.classList.add('active-master');
        ucA.classList.add('active-slave');

        document.getElementById('statusUcB').innerHTML = '<span class="status-chip chip-active">MESTRE (Prioridade)</span>';
        document.getElementById('dutyUcB').innerText = 'Duty Cycle: 70% (Estágio 1 Principal)';

        document.getElementById('statusUcA').innerHTML = '<span class="status-chip chip-partial">ESCRAVA (Modulada)</span>';
        document.getElementById('dutyUcA').innerText = 'Duty Cycle: 50% (Estágio 2 Suporte)';
      }

      ueUnit.classList.add('active-slave');
      document.getElementById('statusUe').innerHTML = '<span class="status-chip chip-active">Otimizada por CLP</span>';
      document.getElementById('dutyUe').innerText = `Controle fino @ ${simState.tempSetpoint}°C ± 1°C`;

      simStatusBadge.innerHTML = '<span class="status-chip chip-active">🟢 Controle Otimizado CLP Ativo</span>';
      simExplanation.innerHTML = `
        <strong>Eficiência Energética em Ação:</strong> Às ${simState.currentHour}:00h, o sistema opera com <strong>${masterName}</strong> prioritária (70% duty) e <strong>${slaveName}</strong> em suporte econômico (50% duty). 
        O rodízio equaliza 100% das horas de desgaste e economiza <strong>R$ 217.686,42/ano</strong>.
      `;
    }
  }
}

/**
 * ==========================================================================
 * CATÁLOGO INTERATIVO DOS 38 CLIMATIZADORES
 * ==========================================================================
 */
function initCatalog() {
  const container = document.getElementById('equipmentGrid');
  const searchInput = document.getElementById('catalogSearch');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const counterSpan = document.getElementById('catalogCount');

  if (!container || !searchInput) return;

  let currentFilter = 'all';
  let currentSearch = '';

  function renderList() {
    container.innerHTML = '';

    const filtered = CLIMATIZERS_DATA.filter(item => {
      const matchFilter = currentFilter === 'all' || item.uePowerUnitKw === parseFloat(currentFilter);
      const matchSearch = currentSearch === '' || 
        item.tag.toLowerCase().includes(currentSearch.toLowerCase()) || 
        item.area.toLowerCase().includes(currentSearch.toLowerCase()) ||
        item.ucs.toLowerCase().includes(currentSearch.toLowerCase());
      return matchFilter && matchSearch;
    });

    counterSpan.innerText = `Exibindo ${filtered.length} de 38 climatizadores`;

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'equip-card';
      card.innerHTML = `
        <div>
          <div class="equip-card-top">
            <span class="equip-tag">${item.tag}</span>
            <span class="equip-badge-power">${item.ueCount}x UE (${item.uePowerUnitKw} kW)</span>
          </div>
          <div class="equip-location" title="${item.area}">📍 ${item.area}</div>
          <div class="equip-specs-list">
            <div class="equip-spec-item">
              <span class="equip-spec-label">Condensadoras</span>
              <span class="equip-spec-val">2x 10,0 kW</span>
            </div>
            <div class="equip-spec-item">
              <span class="equip-spec-label">Potência Total</span>
              <span class="equip-spec-val">${item.totalPowerKw.toFixed(1)} kW</span>
            </div>
            <div class="equip-spec-item">
              <span class="equip-spec-label">Corrente (380V)</span>
              <span class="equip-spec-val">${item.currentAmp.toFixed(1)} A</span>
            </div>
            <div class="equip-spec-item">
              <span class="equip-spec-label">Redução Térmica</span>
              <span class="equip-spec-val" style="color: var(--accent-emerald);">-${item.reductionPercent}%</span>
            </div>
          </div>
        </div>
        <div class="equip-savings-footer">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Economia Anual</span>
          <span class="equip-savings-val">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.annualSavingsReais)}</span>
        </div>
      `;

      card.addEventListener('click', () => openModal(item));
      container.appendChild(card);
    });
  }

  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderList();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-power');
      renderList();
    });
  });

  renderList();
}

/**
 * Modal de Detalhes Técnicos
 */
function openModal(item) {
  const modalOverlay = document.getElementById('equipModalOverlay');
  const modalTag = document.getElementById('modalTag');
  const modalBody = document.getElementById('modalBody');

  if (!modalOverlay || !item) return;

  modalTag.innerText = `Ficha Técnica — ${item.tag}`;
  modalBody.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <p style="font-size: 0.85rem; color: var(--text-muted);">Localização no Shopping</p>
      <h4 style="font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${item.area}</h4>
    </div>
    <table class="modal-specs-table">
      <tbody>
        <tr><td>Unidades Condensadoras:</td><td>${item.ucs} (2x 10,0 kW)</td></tr>
        <tr><td>Unidade Evaporadora:</td><td>${item.ueCount}x ${item.uePowerUnitKw} kW</td></tr>
        <tr><td>Potência Instalada Total:</td><td>${item.totalPowerKw.toFixed(1)} kW</td></tr>
        <tr><td>Tensão de Operação:</td><td>380V Trifásico @ 60Hz (FP 0,95)</td></tr>
        <tr><td>Corrente Nominal em Carga:</td><td>${item.currentAmp.toFixed(1)} Amperes</td></tr>
        <tr><td>Consumo Mensal Anterior:</td><td>${item.monthlyKwhBefore.toLocaleString('pt-BR')} kWh/mês</td></tr>
        <tr><td>Consumo Mensal com CLP:</td><td>${item.monthlyKwhAfter.toLocaleString('pt-BR')} kWh/mês</td></tr>
        <tr><td>Economia de Energia Mensal:</td><td style="color: var(--accent-emerald);">${item.monthlySavingsKwh.toLocaleString('pt-BR')} kWh/mês (-${item.reductionPercent}%)</td></tr>
        <tr><td>Economia Financeira Anual:</td><td style="color: var(--accent-emerald); font-weight: 800;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.annualSavingsReais)}</td></tr>
      </tbody>
    </table>
    <div style="background: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
      <strong>Estratégia de Controle CLP:</strong> Programação ladder com rampa suave de pull-down (1,5h) e revezamento automático mestre/escrava a cada 12h, com histerese de 1°C e monitoramento contínuo de sobrecorrente.
    </div>
  `;

  modalOverlay.classList.add('active');
}

window.closeEquipModal = function () {
  const modalOverlay = document.getElementById('equipModalOverlay');
  if (modalOverlay) modalOverlay.classList.remove('active');
};

/**
 * ==========================================================================
 * ROADMAP E FAQ ACORDEOM
 * ==========================================================================
 */
function initRoadmapAndFaq() {
  // Render Roadmap
  const roadmapContainer = document.getElementById('roadmapContainer');
  if (roadmapContainer) {
    roadmapContainer.innerHTML = '';
    ROADMAP_STEPS.forEach(step => {
      const item = document.createElement('div');
      item.className = 'roadmap-item';
      item.innerHTML = `
        <div class="roadmap-step-badge">${step.step}</div>
        <div class="roadmap-card">
          <div class="roadmap-header">
            <h4 class="roadmap-title">${step.phase}</h4>
            <span class="roadmap-duration">⏱️ ${step.duration}</span>
          </div>
          <p class="roadmap-desc">${step.description}</p>
          <div class="roadmap-deliverable">
            <span>✅ <strong>Entregável:</strong> ${step.deliverable}</span>
          </div>
        </div>
      `;
      roadmapContainer.appendChild(item);
    });
  }

  // Render FAQs
  const faqContainer = document.getElementById('faqContainer');
  if (faqContainer) {
    faqContainer.innerHTML = '';
    FAQS_DATA.forEach(faq => {
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.innerHTML = `
        <button class="faq-question">
          <span>${faq.question}</span>
          <div class="faq-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </button>
        <div class="faq-answer">
          <p>${faq.answer}</p>
        </div>
      `;

      const btn = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');

      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(el => {
          el.classList.remove('active');
          el.querySelector('.faq-answer').style.maxHeight = null;
        });
        if (!isActive) {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
        }
      });

      faqContainer.appendChild(item);
    });
  }
}

/**
 * ==========================================================================
 * MODO DE APRESENTAÇÃO E IMPRESSÃO EXECUTIVA
 * ==========================================================================
 */
function initExecutiveExport() {
  const printButtons = document.querySelectorAll('.trigger-print');
  printButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      window.print();
    });
  });
}
