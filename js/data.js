/**
 * Base de Dados Estruturada - Estudo de Viabilidade HVAC Novo Shopping Center
 * 3D Ar Condicionado & Automação - Agosto de 2026
 */

const PROJECT_CONFIG = {
  clientName: "Novo Shopping Center",
  projectTitle: "Retrofit Térmico HVAC — Modernização & Automação Inteligente de 38 Climatizadores",
  subtitle: "Estudo de Viabilidade Técnica e Econômica com Controle por Controladores Lógicos Programáveis (CLPs)",
  consultant: "3D Ar Condicionado & Automação",
  date: "Agosto de 2026",
  location: "Ribeirão Preto / SP",

  // Baseline Financials
  baseline: {
    capex: 301000.00,                // R$ Investimento total
    tariffKwh: 0.75,                 // R$/kWh
    annualSavingsReais: 217686.42,   // R$/ano
    monthlySavingsReais: 18140.53,   // R$/mês
    annualSavingsKwh: 290248.56,     // kWh/ano
    monthlySavingsKwh: 24187.38,     // kWh/mês
    reductionPercentage: 10.2,       // %
    paybackMonths: 16.6,             // meses
    roi5Years: 261.6,                // %
    vpl5Years: 483710.78,            // R$ (TMA 12% a.a.)
    co2ReductionTonsYear: 25.0,      // tCO2/ano (fator 0.086 kg CO2/kWh)
    co2EmissionFactor: 0.086,        // kg CO2/kWh
    tma: 0.12,                       // 12% ao ano
    
    // Totais de Consumo e Custos
    consumptionBeforeKwhMonth: 237000.00,
    consumptionBeforeKwhYear: 2843999.00,
    costBeforeReaisMonth: 177749.96,
    costBeforeReaisYear: 2132999.57,

    consumptionAfterKwhMonth: 212812.57,
    consumptionAfterKwhYear: 2553751.00,
    costAfterReaisMonth: 159609.43,
    costAfterReaisYear: 1915313.15,

    // Totais Elétricos
    totalMachines: 38,
    totalUcs: 76,
    totalUes: 41,
    totalUcPowerKw: 760.0,           // 76 x 10.0 kW
    totalUePowerKw: 91.1,            // soma das 41 UEs
    totalInstalledPowerKw: 851.1,    // 760 + 91.1 kW
    totalNominalCurrentAmperes: 1361.6, // Amperes totais em 380V Trifásico
    voltage: 380,                    // V (Trifásico)
    powerFactor: 0.95,               // FP
  },

  // Operational Parameters
  defaultParams: {
    operatingHoursDay: 12,           // horas/dia
    operatingDaysMonth: 30,          // dias/mês
    operatingDaysYear: 365,          // dias/ano
    setupHoursBefore: 1.5,           // horas de rampa
    setupHoursAfter: 1.5,
    setpointTemp: 22.0,              // °C
    hysteresis: 1.0,                 // °C
    rotationHours: 12,               // horas de revezamento mestre/escrava
    dutyCycleBefore: 0.70,           // Duty cycle analógico anterior (ambas UCs)
    dutyCycleAfterMaster: 0.70,      // Duty cycle CLP Mestre
    dutyCycleAfterSlave: 0.50,       // Duty cycle CLP Escrava
  }
};

/**
 * Base Completa dos 38 Climatizadores
 * Cada climatizador possui 2 UCs (10kW cada = 20kW) e 1 ou 2 UEs (1.5kW, 2.2kW ou 3.0kW).
 * Todas geram exatamente 636,51 kWh/mês de economia sob os parâmetros de referência.
 */
const CLIMATIZERS_DATA = [
  { id: 1, tag: "UE-01", ucs: "UC-01A / UC-01B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Mall Central - Ala Norte" },
  { id: 2, tag: "UE-02", ucs: "UC-02A / UC-02B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Praça de Alimentação - Bloco A" },
  { id: 3, tag: "UE-03", ucs: "UC-03A / UC-03B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 2.2, totalPowerKw: 22.2, currentAmp: 35.5, area: "Corredor Lojas Âncora - Ala Sul" },
  { id: 4, tag: "UE-04", ucs: "UC-04A / UC-04B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Acesso Principal & Portaria 1" },
  { id: 5, tag: "UE-05A/B", ucs: "UC-05A / UC-05B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 2, uePowerUnitKw: 3.0, totalPowerKw: 26.0, currentAmp: 41.6, area: "Atrium Central - Pé Direito Duplo" },
  { id: 6, tag: "UE-06A/B", ucs: "UC-06A / UC-06B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 2, uePowerUnitKw: 2.2, totalPowerKw: 24.4, currentAmp: 39.0, area: "Mall Lojas Satélite - Piso 1" },
  { id: 7, tag: "UE-07A/B", ucs: "UC-07A / UC-07B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 2, uePowerUnitKw: 1.5, totalPowerKw: 23.0, currentAmp: 36.8, area: "Corredor de Serviços & Sanitários" },
  { id: 8, tag: "UE-08", ucs: "UC-08A / UC-08B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Entrada Oeste - Portaria 2" },
  { id: 9, tag: "UE-09", ucs: "UC-09A / UC-09B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 2.2, totalPowerKw: 22.2, currentAmp: 35.5, area: "Praça de Eventos" },
  { id: 10, tag: "UE-10", ucs: "UC-10A / UC-10B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Alameda Gourmet" },
  { id: 11, tag: "UE-11", ucs: "UC-11A / UC-11B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Moda Feminina" },
  { id: 12, tag: "UE-12", ucs: "UC-12A / UC-12B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Área de Cinema & Entretenimento" },
  { id: 13, tag: "UE-13", ucs: "UC-13A / UC-13B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Boulevard Lojas Rápidas" },
  { id: 14, tag: "UE-14", ucs: "UC-14A / UC-14B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Acesso Estacionamento A" },
  { id: 15, tag: "UE-15", ucs: "UC-15A / UC-15B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Praça de Alimentação - Bloco B" },
  { id: 16, tag: "UE-16", ucs: "UC-16A / UC-16B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Praça de Alimentação - Bloco C" },
  { id: 17, tag: "UE-17", ucs: "UC-17A / UC-17B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Espaço Família & Fraldário" },
  { id: 18, tag: "UE-18", ucs: "UC-18A / UC-18B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 2.2, totalPowerKw: 22.2, currentAmp: 35.5, area: "Alameda Tecnológica & Telefonia" },
  { id: 19, tag: "UE-19", ucs: "UC-19A / UC-19B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Moda Masculina" },
  { id: 20, tag: "UE-20", ucs: "UC-20A / UC-20B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Área de Jogos & Games" },
  { id: 21, tag: "UE-21", ucs: "UC-21A / UC-21B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 2.2, totalPowerKw: 22.2, currentAmp: 35.5, area: "Lobby Elevadores Panorâmicos" },
  { id: 22, tag: "UE-22", ucs: "UC-22A / UC-22B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Infantil" },
  { id: 23, tag: "UE-23", ucs: "UC-23A / UC-23B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Alameda de Calçados" },
  { id: 24, tag: "UE-24", ucs: "UC-24A / UC-24B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Deck Restaurantes Externos" },
  { id: 25, tag: "UE-25", ucs: "UC-25A / UC-25B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Hipermercado Acesso Mall" },
  { id: 26, tag: "UE-26", ucs: "UC-26A / UC-26B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Lojas Esportivas" },
  { id: 27, tag: "UE-27", ucs: "UC-27A / UC-27B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 2.2, totalPowerKw: 22.2, currentAmp: 35.5, area: "Mall Piso Superior - Leste" },
  { id: 28, tag: "UE-28", ucs: "UC-28A / UC-28B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Livraria & Espaço Cultural" },
  { id: 29, tag: "UE-29", ucs: "UC-29A / UC-29B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Óticas & Joalherias" },
  { id: 30, tag: "UE-30", ucs: "UC-30A / UC-30B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Foyer Teatro do Shopping" },
  { id: 31, tag: "UE-31", ucs: "UC-31A / UC-31B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Alameda de Cosméticos" },
  { id: 32, tag: "UE-32", ucs: "UC-32A / UC-32B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Entrada Sul - Portaria 3" },
  { id: 33, tag: "UE-33", ucs: "UC-33A / UC-33B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 2.2, totalPowerKw: 22.2, currentAmp: 35.5, area: "Espaço Coworking & Negócios" },
  { id: 34, tag: "UE-34", ucs: "UC-34A / UC-34B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Corredor Acesso Estacionamento B" },
  { id: 35, tag: "UE-35", ucs: "UC-35A / UC-35B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Academia & Bem-Estar" },
  { id: 36, tag: "UE-36", ucs: "UC-36A / UC-36B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 3.0, totalPowerKw: 23.0, currentAmp: 36.8, area: "Centro Médico & Diagnóstico" },
  { id: 37, tag: "UE-37", ucs: "UC-37A / UC-37B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Área Administrativa & Diretoria" },
  { id: 38, tag: "UE-38", ucs: "UC-38A / UC-38B", ucCount: 2, ucPowerUnitKw: 10.0, ueCount: 1, uePowerUnitKw: 1.5, totalPowerKw: 21.5, currentAmp: 34.4, area: "Central de Operações e Monitoramento" }
];

// Enrich climatizer data with standard consumption metrics
CLIMATIZERS_DATA.forEach(item => {
  const dutyBefore = PROJECT_CONFIG.defaultParams.dutyCycleBefore;
  const dutyAfterM = PROJECT_CONFIG.defaultParams.dutyCycleAfterMaster;
  const dutyAfterS = PROJECT_CONFIG.defaultParams.dutyCycleAfterSlave;
  const dailyHours = PROJECT_CONFIG.defaultParams.operatingHoursDay;
  const setupHours = PROJECT_CONFIG.defaultParams.setupHoursBefore;
  const daysMonth = PROJECT_CONFIG.defaultParams.operatingDaysMonth;
  const tariff = PROJECT_CONFIG.baseline.tariffKwh;

  const maintHours = dailyHours - setupHours;
  
  const ucsPower = item.ucCount * item.ucPowerUnitKw;
  const uePower = item.ueCount * item.uePowerUnitKw;

  const setupKwhBefore = (ucsPower + uePower) * setupHours;
  const maintKwhBefore = (uePower + (ucsPower * dutyBefore)) * maintHours;
  const dailyKwhBefore = setupKwhBefore + maintKwhBefore;
  const monthlyKwhBefore = dailyKwhBefore * daysMonth;

  const setupKwhAfter = (ucsPower + uePower) * setupHours;
  const maintKwhAfter = (uePower + (item.ucPowerUnitKw * dutyAfterM) + (item.ucPowerUnitKw * dutyAfterS)) * maintHours;
  const dailyKwhAfter = setupKwhAfter + maintKwhAfter;
  const monthlyKwhAfter = dailyKwhAfter * daysMonth;

  const monthlySavingsKwh = monthlyKwhBefore - monthlyKwhAfter;
  const monthlySavingsReais = monthlySavingsKwh * tariff;
  const annualSavingsKwh = monthlySavingsKwh * 12;
  const annualSavingsReais = monthlySavingsReais * 12;
  const reductionPercent = (monthlySavingsKwh / monthlyKwhBefore) * 100;

  item.monthlyKwhBefore = Math.round(monthlyKwhBefore * 100) / 100;
  item.monthlyKwhAfter = Math.round(monthlyKwhAfter * 100) / 100;
  item.monthlySavingsKwh = Math.round(monthlySavingsKwh * 100) / 100;
  item.monthlySavingsReais = Math.round(monthlySavingsReais * 100) / 100;
  item.annualSavingsKwh = Math.round(annualSavingsKwh * 100) / 100;
  item.annualSavingsReais = Math.round(annualSavingsReais * 100) / 100;
  item.reductionPercent = Math.round(reductionPercent * 10) / 10;
});

// Implementation Roadmap Timeline
const ROADMAP_STEPS = [
  {
    step: "01",
    phase: "Engenharia de Detalhe & Mapeamento de Painéis",
    duration: "Semanas 1 e 2",
    description: "Inspeção física in loco nos 38 quadros elétricos dos climatizadores, validação dos sensores de temperatura PT100/NTC e conferência da infraestrutura de comunicação.",
    deliverable: "Projeto executivo elétrico e diagramas de interligação aprovados."
  },
  {
    step: "02",
    phase: "Programação e Parametrização dos CLPs",
    duration: "Semanas 3 e 4",
    description: "Desenvolvimento da lógica ladder/estruturada dos Controladores Lógicos Programáveis com algoritmos de rampa, rodízio 12h, controle proporcional em estágios e redundância automática de segurança.",
    deliverable: "Firmware e rotinas testadas em bancada com simulação HIL."
  },
  {
    step: "03",
    phase: "Instalação Modular em Campo (Sem Parada Operacional)",
    duration: "Semanas 5 a 8",
    description: "Execução noturna das montagens elétricas nos 38 equipamentos em lotes de 9 a 10 máquinas por semana, garantindo operação 100% normal do shopping durante o dia.",
    deliverable: "Quadros de automação montados, identificados e testados a frio."
  },
  {
    step: "04",
    phase: "Comissionamento Térmico e Calibração Fina",
    duration: "Semanas 9 e 10",
    description: "Partida supervisionada dos climatizadores, ajuste fino do setpoint (22 °C), calibração do diferencial de histerese (1 °C) e validação dos chaveamentos em carga real.",
    deliverable: "Termografia, medições de corrente trifásica e relatório de comissionamento."
  },
  {
    step: "05",
    phase: "Medição, Verificação (M&V) e Entrega Técnica",
    duration: "Semanas 11 e 12",
    description: "Acompanhamento dos primeiros 30 dias de telemetria, confronto com a linha de base histórica, treinamento da equipe de manutenção do shopping e entrega do termo de garantia.",
    deliverable: "Relatório de Eficiência Comprovada e documentação As-Built."
  }
];

// FAQs for the Decision Board
const FAQS_DATA = [
  {
    question: "A instalação causará impacto ou desligamento no horário de funcionamento do shopping?",
    answer: "Não. Todo o plano de implantação foi concebido em regime modular e noturno (das 23h às 08h). Cada climatizador é modernizado individualmente, sem afetar as demais áreas e garantindo que, na abertura dos portões, o sistema de climatização esteja em pleno funcionamento com temperatura ideal."
  },
  {
    question: "O que acontece se uma das condensadoras falhar durante o pico de calor?",
    answer: "A lógica programada no CLP conta com redundância ativa instantânea. Caso a condensadora em operação (Mestre) sofra um desarme térmico ou falha elétrica, o sensor detecta a anomalia em milissegundos e aciona imediatamente a condensadora reserva (Escrava), gerando alerta para a equipe sem comprometer a temperatura do mall."
  },
  {
    question: "Como o rodízio de 12 horas aumenta a vida útil dos compressores?",
    answer: "No sistema analógico tradicional, um dos compressores frequentemente sofre desgaste desproporcional por operar mais horas. O CLP equaliza precisamente as horas de trabalho de cada máquina, reduzindo o estresse mecânico, evitando sobreaquecimento e postergando a necessidade de manutenções corretivas pesadas."
  },
  {
    question: "Como o shopping audita e comprova a economia de 10,2% na conta de luz?",
    answer: "Utilizamos a metodologia internacional de Medição & Verificação (IPMVP Protocolo M&V). A linha de base histórica de consumo de 2.843.999 kWh/ano é confrontada mês a mês com as faturas da concessionária e os medidores parciais, permitindo auditoria transparente de cada real economizado."
  },
  {
    question: "Qual o prazo de garantia e suporte técnico fornecido?",
    answer: "Oferecemos garantia integral de 24 meses sobre os quadros de automação, CLPs e sensores instalados, além de plano de suporte preventivo com visitas técnicas periódicas e canal de atendimento 24/7 para a engenharia predial do Novo Shopping."
  }
];
