#!/usr/bin/env python3
"""
Sincronizador Oficial Nativo: Site/Firebase -> PowerPoint (PPTX)
Utiliza a API Oficial COM do Microsoft PowerPoint para garantir 100% de integridade,
sem corromper o XML e sem exibir mensagens de erro de reparo.
"""
import os
import sys
import json
import urllib.request
import win32com.client
import pythoncom

# Forçar stdout UTF-8 no Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PPTX_PATH = os.path.abspath(r"C:\Users\Eletrica\Desktop\Estudo de Custo Novo Shopping\Analise Final\Estudo_Viabilidade_Retrofit_HVAC_Novo_Shopping.pptx")
EXCEL_PATH = os.path.abspath(r"C:\Users\Eletrica\Desktop\Estudo de Custo Novo Shopping\Final\Planilha_Retrofit.xlsx")

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
            print("[OK] Dados carregados com sucesso do Firebase Firestore!")
            return params
    except Exception as e:
        print(f"[AVISO] Usando parametros padrao ({e})")
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

def update_presentation_native(calc):
    if not os.path.exists(PPTX_PATH):
        print(f"Erro: Arquivo nao encontrado em {PPTX_PATH}")
        return False

    fmtCur = lambda v: f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    fmtInt = lambda v: f"{round(v):,}".replace(",", ".")
    fmtDec = lambda v, d=1: f"{v:.{d}f}".replace(".", ",")

    pythoncom.CoInitialize()
    ppt_app = win32com.client.Dispatch("PowerPoint.Application")
    
    try:
        pres = ppt_app.Presentations.Open(PPTX_PATH, WithWindow=False)

        def safe_replace_text(text_range, old_val, new_val):
            try:
                if old_val in text_range.Text:
                    text_range.Replace(old_val, new_val)
            except Exception:
                pass

        # Percorrer todos os slides
        for slide in pres.Slides:
            for shape in slide.Shapes:
                if shape.HasTextFrame:
                    tf = shape.TextFrame
                    if tf.HasText:
                        tr = tf.TextRange
                        txt = tr.Text
                        if "217.686" in txt:
                            safe_replace_text(tr, "R$ 217.686,42", fmtCur(calc['econAnoR']))
                            safe_replace_text(tr, "R$ 217.686", fmtCur(calc['econAnoR']).split(',')[0])
                            safe_replace_text(tr, "217.686,42", fmtCur(calc['econAnoR']).replace("R$ ", ""))
                            safe_replace_text(tr, "217.686", fmtInt(calc['econAnoR']))
                        if "16,6 meses" in txt or "16,5 meses" in txt:
                            safe_replace_text(tr, "16,6 meses", f"{fmtDec(calc['paybackMeses'], 1)} meses")
                            safe_replace_text(tr, "16,5 meses", f"{fmtDec(calc['paybackMeses'], 1)} meses")
                        if "+261,6%" in txt or "+262,8%" in txt:
                            safe_replace_text(tr, "+261,6%", f"+{fmtDec(calc['roi5'], 1)}%")
                            safe_replace_text(tr, "+262,8%", f"+{fmtDec(calc['roi5'], 1)}%")
                        if "25,0 tCO" in txt:
                            safe_replace_text(tr, "25,0 tCO2/ano", f"{fmtDec(calc['co2'], 1)} tCO2/ano")
                        if "290.249 kWh" in txt:
                            safe_replace_text(tr, "290.249 kWh/ano", f"{fmtInt(calc['econAnoKwh'])} kWh/ano")
                            safe_replace_text(tr, "290.249 kWh", f"{fmtInt(calc['econAnoKwh'])} kWh")
                        if "18.140" in txt:
                            safe_replace_text(tr, "R$ 18.140,53", fmtCur(calc['econMesR']))
                            safe_replace_text(tr, "R$ 18.140,54", fmtCur(calc['econMesR']))
                            safe_replace_text(tr, "R$ 18.140", fmtCur(calc['econMesR']).split(',')[0])
                        if "483.71" in txt or "484.71" in txt:
                            safe_replace_text(tr, "R$ 483.710", fmtCur(calc['vpl']).split(',')[0])
                            safe_replace_text(tr, "R$ 484.710", fmtCur(calc['vpl']).split(',')[0])

                if shape.HasTable:
                    table = shape.Table
                    for r in range(1, table.Rows.Count + 1):
                        row_cell_1 = table.Cell(r, 1).Shape.TextFrame.TextRange.Text.strip()
                        
                        # Slide 6: Tabela de Parâmetros Gerais
                        if "Tarifa de Energia" in row_cell_1 and table.Columns.Count >= 2:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = fmtCur(calc['tarifa'])
                        elif "Duty Cycle Mestre" in row_cell_1 and table.Columns.Count >= 2:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = f"{calc['dcMestre']:.2f} ({calc['dcMestre']*100:.0f}%)"
                        elif "Duty Cycle Escrava" in row_cell_1 and table.Columns.Count >= 2:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = f"{calc['dcEscrava']:.2f} ({calc['dcEscrava']*100:.0f}%)"
                        elif "Duty Cycle Antes" in row_cell_1 and table.Columns.Count >= 2:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = f"{calc['dcAntes']:.2f} ({calc['dcAntes']*100:.0f}%)"

                        # Slide 10: Tabela Comparativa de Consumo e Custos
                        if "Consumo Mensal de Energia" in row_cell_1 and table.Columns.Count >= 5:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = f"{fmtInt(calc['consAntesMes'])} kWh"
                            table.Cell(r, 3).Shape.TextFrame.TextRange.Text = f"{fmtInt(calc['consDepoisMes'])} kWh"
                            table.Cell(r, 4).Shape.TextFrame.TextRange.Text = f"{fmtInt(calc['econMesKwh'])} kWh"
                            table.Cell(r, 5).Shape.TextFrame.TextRange.Text = f"-{fmtDec(calc['redPerc'], 1)}%"
                        elif "Consumo Anual de Energia" in row_cell_1 and table.Columns.Count >= 5:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = f"{fmtInt(calc['consAntesAno'])} kWh"
                            table.Cell(r, 3).Shape.TextFrame.TextRange.Text = f"{fmtInt(calc['consDepoisAno'])} kWh"
                            table.Cell(r, 4).Shape.TextFrame.TextRange.Text = f"{fmtInt(calc['econAnoKwh'])} kWh"
                            table.Cell(r, 5).Shape.TextFrame.TextRange.Text = f"-{fmtDec(calc['redPerc'], 1)}%"
                        elif "Gasto Operacional Mensal" in row_cell_1 and table.Columns.Count >= 5:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = fmtCur(calc['custoAntesMes'])
                            table.Cell(r, 3).Shape.TextFrame.TextRange.Text = fmtCur(calc['custoDepoisMes'])
                            table.Cell(r, 4).Shape.TextFrame.TextRange.Text = fmtCur(calc['econMesR'])
                            table.Cell(r, 5).Shape.TextFrame.TextRange.Text = f"-{fmtDec(calc['redPerc'], 1)}%"
                        elif "Gasto Operacional Anual" in row_cell_1 and table.Columns.Count >= 5:
                            table.Cell(r, 2).Shape.TextFrame.TextRange.Text = fmtCur(calc['custoAntesAno'])
                            table.Cell(r, 3).Shape.TextFrame.TextRange.Text = fmtCur(calc['custoDepoisAno'])
                            table.Cell(r, 4).Shape.TextFrame.TextRange.Text = fmtCur(calc['econAnoR'])
                            table.Cell(r, 5).Shape.TextFrame.TextRange.Text = f"-{fmtDec(calc['redPerc'], 1)}%"

        pres.Save()
        pres.Close()
        print("\n[SUCESSO] Apresentacao salva nativamente sem nenhum erro de integridade!")
        print(f"[ARQUIVO] {PPTX_PATH}")
        return True
    finally:
        ppt_app.Quit()
        pythoncom.CoUninitialize()

if __name__ == "__main__":
    params = fetch_params_from_firebase()
    calc = calculate_system(params)
    print("\n--- DADOS RECALCULADOS DA BASE ---")
    print(f"• Tarifa: R$ {calc['tarifa']:.2f}/kWh | CAPEX: R$ {calc['capex']:,.2f}")
    print(f"• Duty Mestre: {calc['dcMestre']*100:.0f}% | Duty Escrava: {calc['dcEscrava']*100:.0f}%")
    print(f"• Economia Anual: R$ {calc['econAnoR']:,.2f} ({calc['econAnoKwh']:,.0f} kWh/ano)")
    print(f"• Economia Mensal: R$ {calc['econMesR']:,.2f} ({calc['econMesKwh']:,.0f} kWh/mês)")
    print(f"• Payback Simples: {calc['paybackMeses']:.1f} meses | ROI (5a): +{calc['roi5']:.1f}% | VPL: R$ {calc['vpl']:,.2f}")
    print("----------------------------------\n")
    update_presentation_native(calc)
