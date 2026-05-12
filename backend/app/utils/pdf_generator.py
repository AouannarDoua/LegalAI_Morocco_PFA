# backend/utils/pdf_generator.py
from fpdf import FPDF
import os

def generate_cdi_pdf(details):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    
    pdf.cell(200, 10, txt="CONTRAT DE TRAVAIL (CDI)", ln=True, align='C')
    pdf.ln(10)
    
    pdf.set_font("Arial", size=12)
    
    # Correction des clés pour correspondre aux noms des champs de ton formulaire React
    # On utilise .get('cle', 'Valeur par défaut')
    employer = details.get('employerName') or details.get('employer', '')
    employee = details.get('employeeName') or details.get('employee', '')
    position = details.get('position') or details.get('jobTitle', '')
    salary   = details.get('salary') or details.get('monthlySalary', '')
    startDate = details.get('startDate') or details.get('date', '')
    
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Employeur : {employer}", ln=True)
    pdf.cell(200, 10, txt=f"Employe : {employee}", ln=True)
    pdf.cell(200, 10, txt=f"Poste : {position}", ln=True)
    pdf.cell(200, 10, txt=f"Salaire : {salary} DH", ln=True)
    pdf.cell(200, 10, txt=f"Date de debut : {startDate}", ln=True)

    # Création du dossier uploads s'il n'existe pas
    if not os.path.exists('./uploads'):
        os.makedirs('./uploads')

    file_name = f"contrat_cdi_{details.get('employee', 'temp')}.pdf".replace(" ", "_")
    path = os.path.join('./uploads', file_name)
    pdf.output(path)
    
    return path