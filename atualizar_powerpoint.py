#!/usr/bin/env python3
"""
Script de Sincronização Automática: Site/Firebase -> PowerPoint (PPTX)
Atualiza todos os textos, tabelas, KPIs e indicadores nos 15 slides do PowerPoint
com base nos parâmetros dinâmicos atuais.
"""
import os
import json
import urllib.request
import pptx
from pptx.util import Inches, Pt

PPTX_PATH = r"C:\Users\Eletrica\Desktop\Estudo de Custo Novo Shopping\Analise Final\Estudo_Viabilidade_Retrofit_HVAC_Novo_Shopping.pptx"
EXCEL_PATH = r"C:\Users\Eletrica\Desktop\Estudo de Custo Novo Shopping\Final\Planilha_Retrofit.xlsx"

def fetch_params_from_firebase():
    url = "https://firestore.googleapis.com/v1/projects/analiseenergeticanovoshopping/databases/(default)/documents/config/parametros"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            fields = data.get('fields', {})
            params = {
                'setpoint': float(fields.get('setpoint', {}).get('doubleValue') or fields.get('setpoint', {}).get('integerValue') or 22.0),
                'histerese': float(fields.get('histerese', {}).get('doubleValue') or fields.get('histerese', {}).get('integerValue') or 1.0),
                'erroDuplo': float(fields.get('erroDuplo', {}).get('doubleValue') or fields.get('erroDuplo', {}).get('integerValue') or 2.5),
                'tempoEscrava': float(fields.get('tempoEscrava', {}).get('doubleValue') or fields.get('tempoEscrava', {}).get('integerValue') or 1.0),
                'tempoRevezamento': float(fields.get('tempoRevezamento', {}).get('doubleValue') or fields.get('tempoRevezamento', {}).get('integerValue') or 12.0),
                'tarifa': float(fields.get('tarifa', {}).get('doubleValue') or fields.get('tarifa', {}).get('integerValue') or 0.75),
                'capex': float(fields.get('capex', {}).get('doubleValue') or fields.get('capex', {}).get('integerValue') or 301000.0),
                'dcAntes': float(fields.get('dcAntes', {}).get('doubleValue') or fields.get('dcAntes', {}).get('integerValue') or 0.70),
                'dcMestre': float(fields.get('dcMestre', {}).get('doubleValue') or fields.get('dcMestre', {}).get('integerValue') or 0.70),
                'dcEscrava': float(fields.get('dcEscrava', {}).get('doubleValue') or fields.get('dcEscrava', {}).get('integerValue') or 0.50),
            }
            print("Dados carregados com sucesso do Firebase Firestore!")
            return params
    except Exception as e:
        print(f"Aviso: Não foi possível conectar ao Firebase ({e}). Usando parâmetros padrão do estudo.")
        return {
            'setpoint': 22.0, 'histerese': 1.0, 'erroDuplo': 2.5, 'tempoEscrava': 1.0,
            'tempoRevezamento': 12.0, 'tarifa': 0.75, 'capex': 301000.0,
            'dcAntes': 0.70, 'dcMestre': 0.70, 'dcEscrava': 0.50
        }

def calculate_system(params):
    import openpyxl
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws_c = wb["Cadastro de Equipamentos"]
    ws_u = wb["Perfil de Uso e Consumo"]

    equipamentos = []
    for r in range(4, 42):
        tag = ws_c[f"A{r}"].value
        if not tag or tag == "Total": continue
        potUC = float(ws_c[f"B{r}"].value or 0)
        qtdUC = float(ws_c[f"C{r}"].value or 0)
        potUE = float(ws_c[f"D{r}"].value or 0)
        qtdUE = float(ws_c[f"E{r}"].value or 0)
        equipamentos.append({
            'tag': tag, 'potUC': potUC, 'qtdUC': qtdUC, 'potUE': potUE, 'qtdUE': qtdUE,
            'potTotal': potUC*qtdUC + potUE*qtdUE,
            'corrente': (potUC*qtdUC + potUE*qtdUE)*1000 / (1.732 * 380 * 0.95)
        })

    perfil = []
    for r in range(4, 42):
        tag = ws_u[f"A{r}"].value
        if not tag or "Total" in str(tag): continue
        perfil.append({
            'tag': tag,
            'hSegSex': float(ws_u[f"B{r}"].value or 12),
            'hSab': float(ws_u[f"C{r}"].value or 12),
            'hDom': float(ws_u[f"D{r}"].value or 12),
            'setupAntes': float(ws_u[f"E{r}"].value or 1.5),
            'setupDepois': float(ws_u[f"F{r}"].value or 1.5),
        })

    def consumo_dia(eq, horas, setup, modo):
        consUE = eq['potUE'] * eq['qtdUE'] * horas
        if horas <= 0: return consUE
        if modo == 'antes':
            consUC_setup = eq['qtdUC'] * eq['potUC'] * min(horas, setup)
            consUC_manut = eq['qtdUC'] * eq['potUC'] * max(0, horas - setup) * params['dcAntes']
            return consUE + consUC_setup + consUC_manut
        else:
            consUC_setup = eq['qtdUC'] * eq['potUC'] * min(horas, setup)
            consUC_manut = (1 * eq['potUC'] * params['dcMestre'] + (eq['qtdUC'] - 1) * eq['potUC'] * params['dcEscrava']) * max(0, horas - setup)
            return consUE + consUC_setup + consUC_manut

    consAntesMes = 0.0
    consDepoisMes = 0.0
    for eq, u in zip(equipamentos, perfil):
        cA = 4.33 * (5 * consumo_dia(eq, u['hSegSex'], u['setupAntes'], 'antes') +
                     1 * consumo_dia(eq, u['hSab'], u['setupAntes'], 'antes') +
                     1 * consumo_dia(eq, u['hDom'], u['setupAntes'], 'antes'))
        cD = 4.33 * (5 * consumo_dia(eq, u['hSegSex'], u['setupDepois'], 'depois') +
                     1 * consumo_dia(eq, u['hSab'], u['setupDepois'], 'depois') +
                     1 * consumo_dia(eq, u['hDom'], u['setupDepois'], 'depois'))
        consAntesMes += cA
        consDepoisMes += cD

    econMesKwh = consAntesMes - consDepoisMes
    consAntesAno = consAntesMes * 12
    consDepoisAno = consDepoisMes * 12
    econAnoKwh = econMesKwh * 12
    redPerc = (econMesKwh / consAntesMes) * 100

    custoAntesMes = consAntesMes * params['tarifa']
    custoDepoisMes = consDepoisMes * params['tarifa']
    econMesR = econMesKwh * params['tarifa']

    custoAntesAno = custoAntesMes * 12
    custoDepoisAno = custoDepoisMes * 12
    econAnoR = econMesR * 12

    paybackMeses = params['capex'] / econMesR if econMesR > 0 else 999.0
    roi5 = ((econAnoR * 5 - params['capex']) / params['capex']) * 100 if params['capex'] > 0 else 0.0
    vpl = econAnoR * 3.604776 - params['capex']
    co2 = (econAnoKwh * 0.086) / 1000.0

    return {
        'consAntesMes': consAntesMes, 'consDepoisMes': consDepoisMes, 'econMesKwh': econMesKwh,
        'consAntesAno': consAntesAno, 'consDepoisAno': consDepoisAno, 'econAnoKwh': econAnoKwh,
        'redPerc': redPerc,
        'custoAntesMes': custoAntesMes, 'custoDepoisMes': custoDepoisMes, 'econMesR': econMesR,
        'custoAntesAno': custoAntesAno, 'custoDepoisAno': custoDepoisAno, 'econAnoR': econAnoR,
        'paybackMeses': paybackMeses, 'roi5': roi5, 'vpl': vpl, 'co2': co2,
        'capex': params['capex'], 'tarifa': params['tarifa'],
        'dcAntes': params['dcAntes'], 'dcMestre': params['dcMestre'], 'dcEscrava': params['dcEscrava'],
        'setpoint': params['setpoint'], 'histerese': params['histerese'], 'tempoRevezamento': params['tempoRevezamento']
    }

def update_pptx(calc):
    if not os.path.exists(PPTX_PATH):
        print(f"Erro: Arquivo PPTX não encontrado em {PPTX_PATH}")
        return False

    prs = pptx.Presentation(PPTX_PATH)

    fmtCur = lambda v: f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    fmtInt = lambda v: f"{round(v):,}".replace(",", ".")
    fmtDec = lambda v, d=1: f"{v:.{d}f}".replace(".", ",")

    for slide_idx, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            if shape.has_text_frame:
                for p in shape.text_frame.paragraphs:
                    # Substituições dinâmicas de valores monetários e energéticos
                    if "R$ 217.686" in p.text or "R$ 217.686,42" in p.text:
                        p.text = p.text.replace("R$ 217.686,42", fmtCur(calc['econAnoR'])).replace("R$ 217.686", fmtCur(calc['econAnoR']).split(',')[0])
                    if "16,6 meses" in p.text or "16,5 meses" in p.text:
                        p.text = p.text.replace("16,6 meses", f"{fmtDec(calc['paybackMeses'], 1)} meses").replace("16,5 meses", f"{fmtDec(calc['paybackMeses'], 1)} meses")
                    if "+261,6%" in p.text or "+262,8%" in p.text:
                        p.text = p.text.replace("+261,6%", f"+{fmtDec(calc['roi5'], 1)}%").replace("+262,8%", f"+{fmtDec(calc['roi5'], 1)}%")
                    if "25,0 tCO2/ano" in p.text or "25,0 tCO" in p.text:
                        p.text = p.text.replace("25,0 tCO2/ano", f"{fmtDec(calc['co2'], 1)} tCO2/ano")
                    if "290.249 kWh/ano" in p.text:
                        p.text = p.text.replace("290.249 kWh/ano", f"{fmtInt(calc['econAnoKwh'])} kWh/ano")
                    if "R$ 18.140,53" in p.text or "R$ 18.140" in p.text:
                        p.text = p.text.replace("R$ 18.140,53", fmtCur(calc['econMesR'])).replace("R$ 18.140", fmtCur(calc['econMesR']).split(',')[0])
                    if "R$ 483.710" in p.text or "R$ 484.710" in p.text:
                        p.text = p.text.replace("R$ 483.710", fmtCur(calc['vpl']).split(',')[0]).replace("R$ 484.710", fmtCur(calc['vpl']).split(',')[0])

            elif shape.has_table:
                table = shape.table
                for row in table.rows:
                    cells_txt = [c.text.strip() for c in row.cells]
                    if len(cells_txt) >= 5:
                        if "Consumo Mensal de Energia" in cells_txt[0]:
                            row.cells[1].text = f"{fmtInt(calc['consAntesMes'])} kWh"
                            row.cells[2].text = f"{fmtInt(calc['consDepoisMes'])} kWh"
                            row.cells[3].text = f"{fmtInt(calc['econMesKwh'])} kWh"
                            row.cells[4].text = f"-{fmtDec(calc['redPerc'], 1)}%"
                        elif "Consumo Anual de Energia" in cells_txt[0]:
                            row.cells[1].text = f"{fmtInt(calc['consAntesAno'])} kWh"
                            row.cells[2].text = f"{fmtInt(calc['consDepoisAno'])} kWh"
                            row.cells[3].text = f"{fmtInt(calc['econAnoKwh'])} kWh"
                            row.cells[4].text = f"-{fmtDec(calc['redPerc'], 1)}%"
                        elif "Gasto Operacional Mensal" in cells_txt[0]:
                            row.cells[1].text = fmtCur(calc['custoAntesMes'])
                            row.cells[2].text = fmtCur(calc['custoDepoisMes'])
                            row.cells[3].text = fmtCur(calc['econMesR'])
                            row.cells[4].text = f"-{fmtDec(calc['redPerc'], 1)}%"
                        elif "Gasto Operacional Anual" in cells_txt[0]:
                            row.cells[1].text = fmtCur(calc['custoAntesAno'])
                            row.cells[2].text = fmtCur(calc['custoDepoisAno'])
                            row.cells[3].text = fmtCur(calc['econAnoR'])
                            row.cells[4].text = f"-{fmtDec(calc['redPerc'], 1)}%"

    prs.save(PPTX_PATH)
    print(f"\n[OK] Apresentação PowerPoint atualizada com sucesso!")
    print(f"Arquivo: {PPTX_PATH}")
    return True

if __name__ == "__main__":
    params = fetch_params_from_firebase()
    calc = calculate_system(params)
    print("\n--- DADOS SINCRONIZADOS ---")
    print(f"• Tarifa: R$ {calc['tarifa']:.2f}/kWh | CAPEX: R$ {calc['capex']:,.2f}")
    print(f"• Duty Mestre: {calc['dcMestre']*100:.0f}% | Duty Escrava: {calc['dcEscrava']*100:.0f}%")
    print(f"• Economia Anual: R$ {calc['econAnoR']:,.2f} ({calc['econAnoKwh']:,.0f} kWh/ano)")
    print(f"• Economia Mensal: R$ {calc['econMesR']:,.2f} ({calc['econMesKwh']:,.0f} kWh/mês)")
    print(f"• Payback Simples: {calc['paybackMeses']:.1f} meses | ROI (5a): +{calc['roi5']:.1f}% | VPL: R$ {calc['vpl']:,.2f}")
    print("---------------------------\n")
    update_pptx(calc)
