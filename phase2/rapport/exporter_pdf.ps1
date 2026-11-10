# Met à jour la table des matières du rapport Word, puis l'exporte en PDF.
# Utilisation (Windows, Word installé) :
#   powershell -ExecutionPolicy Bypass -File phase2\rapport\exporter_pdf.ps1
$ici  = Split-Path -Parent $MyInvocation.MyCommand.Path
$docx = Join-Path $ici "IFT2255_Phase2_Equipe22.docx"
$pdf  = Join-Path $ici "IFT2255_Phase2_Equipe22.pdf"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open($docx)
    $doc.Fields.Update() | Out-Null
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Save()
    $doc.ExportAsFixedFormat([string]$pdf, 17)   # 17 = format PDF
    $doc.Close([ref]0)
    Write-Output "PDF écrit : $pdf"
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
