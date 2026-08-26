/**
 * charts.js - Gestão e Renderização dos Gráficos Interativos (Chart.js)
 * Estudo de Viabilidade HVAC Novo Shopping
 */

let paybackChartInstance = null;
let monthlyComparisonChartInstance = null;
let powerDistChartInstance = null;

/**
 * Inicialização de todos os gráficos
 */
function initCharts() {
  renderPaybackCurveChart(PROJECT_CONFIG.baseline.capex, PROJECT_CONFIG.baseline.annualSavingsReais);
  renderMonthlyComparisonChart(
    PROJECT_CONFIG.baseline.consumptionBeforeKwhMonth,
    PROJECT_CONFIG.baseline.consumptionAfterKwhMonth,
    PROJECT_CONFIG.baseline.costBeforeReaisMonth,
    PROJECT_CONFIG.baseline.costAfterReaisMonth
  );
  renderPowerDistChart();
}

/**
 * 1. Gráfico de Curva de Payback e Fluxo de Caixa Acumulado (60 Meses)
 */
function renderPaybackCurveChart(capex, annualSavings) {
  const ctx = document.getElementById('paybackCurveCanvas');
  if (!ctx) return;

  const months = 60;
  const labels = [];
  const cumulativeCashFlow = [];
  const baselineCapex = [];
  const monthlySavings = annualSavings / 12;

  let breakevenMonth = Math.ceil((capex / annualSavings) * 12 * 10) / 10;

  for (let m = 0; m <= months; m += 2) {
    labels.push(m === 0 ? 'Mês 0' : `Mês ${m}`);
    const accumulated = (monthlySavings * m) - capex;
    cumulativeCashFlow.push(accumulated);
    baselineCapex.push(0); // Linha do Zero (Breakeven)
  }

  if (paybackChartInstance) {
    paybackChartInstance.destroy();
  }

  paybackChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Saldo Acumulado Líquido (R$)',
          data: cumulativeCashFlow,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointRadius: (ctx) => {
            const index = ctx.dataIndex;
            return index === Math.round(breakevenMonth / 2) ? 7 : 2;
          },
          pointBackgroundColor: '#10b981',
          pointHoverRadius: 8
        },
        {
          label: 'Linha de Breakeven (Payback R$ 0,00)',
          data: baselineCapex,
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
            color: '#334155',
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const val = context.parsed.y;
              return `${context.dataset.label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#64748b' }
        },
        y: {
          grid: { color: '#e2e8f0' },
          ticks: {
            font: { family: 'Plus Jakarta Sans', size: 11 },
            color: '#64748b',
            callback: function (value) {
              return 'R$ ' + (value / 1000).toFixed(0) + 'k';
            }
          }
        }
      }
    }
  });
}

/**
 * 2. Gráfico Comparativo Mensal (kWh e R$) Antes vs Depois
 */
function renderMonthlyComparisonChart(kwhBefore, kwhAfter, costBefore, costAfter) {
  const ctx = document.getElementById('monthlyComparisonCanvas');
  if (!ctx) return;

  if (monthlyComparisonChartInstance) {
    monthlyComparisonChartInstance.destroy();
  }

  monthlyComparisonChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Consumo Mensal (kWh)', 'Custo Operacional Mensal (R$)'],
      datasets: [
        {
          label: 'Cenário Anterior (Analógico)',
          data: [kwhBefore, costBefore],
          backgroundColor: '#94a3b8',
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Cenário Modernizado (CLP)',
          data: [kwhAfter, costAfter],
          backgroundColor: '#2563eb',
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
            color: '#334155',
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const val = context.raw;
              if (context.dataIndex === 0) {
                return `${context.dataset.label}: ${new Intl.NumberFormat('pt-BR').format(Math.round(val))} kWh`;
              } else {
                return `${context.dataset.label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 }, color: '#334155' }
        },
        y: {
          grid: { color: '#e2e8f0' },
          ticks: {
            font: { family: 'Plus Jakarta Sans', size: 11 },
            color: '#64748b',
            callback: function (value) {
              return (value / 1000).toFixed(0) + 'k';
            }
          }
        }
      }
    }
  });
}

/**
 * 3. Gráfico de Rosca: Distribuição de Climatizadores por Categoria de Potência da UE
 */
function renderPowerDistChart() {
  const ctx = document.getElementById('powerDistCanvas');
  if (!ctx) return;

  const count1_5 = CLIMATIZERS_DATA.filter(c => c.uePowerUnitKw === 1.5).length;
  const count2_2 = CLIMATIZERS_DATA.filter(c => c.uePowerUnitKw === 2.2).length;
  const count3_0 = CLIMATIZERS_DATA.filter(c => c.uePowerUnitKw === 3.0).length;

  if (powerDistChartInstance) {
    powerDistChartInstance.destroy();
  }

  powerDistChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['UEs 1,5 kW (16 Unid.)', 'UEs 2,2 kW (7 Unid.)', 'UEs 3,0 kW (15 Unid.)'],
      datasets: [
        {
          data: [count1_5, count2_2, count3_0],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
            color: '#334155',
            usePointStyle: true,
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const val = context.raw;
              const total = 38;
              const pct = ((val / total) * 100).toFixed(1);
              return `${context.label}: ${val} climatizadores (${pct}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

/**
 * Atualização dos Gráficos via Calculadora Dinâmica
 */
function updateDynamicCharts(newCapex, newAnnualSavings, newKwhBefore, newKwhAfter, newCostBefore, newCostAfter) {
  renderPaybackCurveChart(newCapex, newAnnualSavings);
  renderMonthlyComparisonChart(newKwhBefore, newKwhAfter, newCostBefore, newCostAfter);
}
